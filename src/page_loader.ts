import type {
    TBFContext,
    Component,
    ComponentActionHandlerThis,
    ComponentActionData,
    DB,
    ComponentActionHandler,
    TBFConfig,
    PaginatorReturn,
    PaginatorComponent,
    ParseButtons,
    ParseButtonsReturn,
} from "./types"

import dataPacker from "./data_packer"
import Paginator from "./paginator"

type loaderArgs = {
    db: DB,
    config: TBFConfig,
    inputComponents: PaginatorComponent[],
    componentType: string
}

type loaderReturn = {
    components: Component[]
}

let loadedComponents: Component[] = [];


function loader({ db, config, inputComponents, componentType }: loaderArgs): loaderReturn {
    async function removeMessageWrapper(sendKey, args = []) {
        let sent = await this.ctx.telegram[sendKey](this.ctx.chatId, ...args);
        await db.messages.addToRemoveMessages(this.ctx, sent, false);
        return sent;
    }

    function routeToAction(ctx: TBFContext, id: string, action: string = 'main', data: ComponentActionData): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let parsedData = dataPacker.packData(data);
            let compiled = `${id}�${action}${parsedData ? ('�' + parsedData) : ''}`;
            let compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
            if (compiled_bytes_length > 64) {
                // save to db under user
                let messagespace = (ctx.callbackQuery?.message?.message_id || ctx.message?.message_id).toString();
                let uniqid = Math.floor(Math.random() * 99999).toString();
                let tempdata_identifier = 'X' + messagespace + "." + uniqid;
                await db.tempData.add(ctx.chatId, messagespace, uniqid, data)
                compiled = `${id}�${action}�${tempdata_identifier}`;

                compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
                if (compiled_bytes_length > 64) {
                    return reject(new Error(`Data is too long. Allowed 64 bytes. Now is ${compiled_bytes_length}.\nTry shortening the title of page or action or cut sending data.\n${compiled}`));
                }
            }
            return resolve(compiled);
        })
    }

    let parseButtons: ParseButtons = function ({ ctx, id, buttons = [] }): ParseButtonsReturn {
        return new Promise(async (resolve, reject) => {
            let inline_buttons = [];
            for (let row of buttons) {
                if (!row) continue;
                let new_row = [];
                for (let button of row) {
                    let callback_data;
                    let url;
                    let component_name = button.page || button.plugin;
                    if (button.action && component_name) {
                        callback_data = await routeToAction(ctx, component_name, button.action.toString(), button.data);
                    } else {
                        if (button.action) {
                            if (typeof button.action == "function") {
                                callback_data = button.action();
                            } else {
                                callback_data = await routeToAction(ctx, id, button.action, button.data);
                            }
                        }
                        if (component_name) {
                            callback_data = await routeToAction(ctx, component_name, 'main', button.data);
                        }
                        if (button.url) {
                            url = button.url.indexOf("http") == 0 ? button.url : config.webServer.address + button.url;
                            if (config.debug) console.log("[parseButtons] url:", url)
                        }
                    }
                    new_row.push({
                        text: button.text,
                        callback_data,
                        url
                    });
                }
                inline_buttons.push(new_row);
            }
            if (config.debug) console.log("[parseButtons] inline_buttons:", inline_buttons)
            return resolve(inline_buttons);
        })
    }



    function extractHandler(action): ComponentActionHandler {
        let action_fn = typeof action == "function" ? action : action.handler;
        return action_fn;
    }

    let components: Component[] = [];

    for (let page of inputComponents) {
        let pageObject: Component;
        try {
            pageObject = page.module({
                db,
                config,
                parseButtons
            })
            if (!pageObject.id) pageObject.id = page.id;
        } catch (error) {
            console.error('📛', "Component loading error:", page.path, error);
            continue;
        }
        if (loadedComponents.find(x => x.id == pageObject.id)) {
            console.error('📛', "Component with same id:", pageObject.id, '- skipped', page.path);
            continue;
        }
        let binding: ComponentActionHandlerThis = {
            id: pageObject.id,
            type: pageObject.type,
            ctx: null,
            async send(this: ComponentActionHandlerThis, { text = "", buttons = [], keyboard = [] }) {
                let _this: ComponentActionHandlerThis = this;
                if (text === undefined) throw new Error("send() text is empty");
                let options = {
                    reply_markup: {
                        inline_keyboard: [],
                        keyboard: [],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                };
                if (buttons.length > 0) {
                    let inline_buttons = await parseButtons({ ctx: _this.ctx, id: _this.id, buttons });
                    options.reply_markup.inline_keyboard = inline_buttons;
                } else {
                    options.reply_markup.inline_keyboard = [];
                }
                if (keyboard.length > 0) {
                    let reply_keyboard = keyboard;
                    options.reply_markup.keyboard = reply_keyboard;
                } else {
                    options.reply_markup.keyboard = [];
                }

                try {
                    let message = await _this.ctx.telegram.sendMessage(_this.ctx.chatId, text, { ...options, parse_mode: 'HTML' });
                    await db.messages.addToRemoveMessages(_this.ctx, [message], false)
                    return message;
                } catch (error) {
                    console.error(error);
                }
            },
            async update(this: ComponentActionHandlerThis, { text = "", buttons = [], keyboard = [] }) {
                if (text === undefined) throw new Error("update() text is empty");

                let options = {
                    reply_markup: {
                        inline_keyboard: [],
                        keyboard: []
                    }
                };
                if (buttons.length > 0) {
                    let inline_buttons = await parseButtons({ ctx: this.ctx, id: this.id, buttons });
                    options.reply_markup.inline_keyboard = inline_buttons;
                } else {
                    options.reply_markup.inline_keyboard = [];
                }
                if (buttons.length > 0) {
                    let reply_keyboard = keyboard;
                    options.reply_markup.keyboard = reply_keyboard;
                } else {
                    options.reply_markup.keyboard = [];
                }

                try {
                    if (this.ctx.routing.isMessageFromUser) {
                        // get last bot's message and update it
                        let lastBotMessage = await db.messages.bot.getLastMessage(this.ctx);
                        if (lastBotMessage) {
                            if (config.debug) console.log("[update] message to update:", lastBotMessage);
                            let edited;
                            edited = await this.ctx.telegram.editMessageText(
                                this.ctx.chatId,
                                lastBotMessage.messageId,
                                undefined,
                                text,
                                { ...options, parse_mode: 'HTML' }
                            );
                            await db.messages.removeMessages(this.ctx, true);
                            return edited;
                        }

                    }
                } catch (e) {
                    console.warn("⚠️", "Warning:", e);
                }

                try {
                    return await this.ctx.editMessageText(text, { ...options, parse_mode: 'HTML' });
                } catch (error) {
                    console.error("update error", error);
                    return null;
                }
            },
            async sendMediaGroup(this: ComponentActionHandlerThis, { media = [], options = {} }) {
                if (media.length === 0) throw new Error("sendMediaGroup() media is empty");
                try {
                    return await removeMessageWrapper.bind(this)('sendMediaGroup', [media, options]);
                } catch (error) {
                    console.error("sendMediaGroup error", error);
                    return null;
                }
            },
            async goToComponent(this: ComponentActionHandlerThis, { component, action = "main", data, type = "" }) {
                if (!type) return Error("goToComponent() type is empty");
                let _this: ComponentActionHandlerThis = this;
                let found_component = loadedComponents.find(x => x.id == component && x.type == type);
                if (found_component) {
                    await db.setValue(_this.ctx, "step", component + "�" + action);
                    let action_fn = extractHandler(found_component.actions[action]);
                    try {
                        return await action_fn.bind({ ..._this, ...{ id: component } })({ ctx: _this.ctx, data });
                    } catch (error) {
                        console.error("goToComponent error", error);
                        return null;
                    }
                } else {
                    throw new Error("goToComponent() component not found: " + component);
                }
            },
            async goToPage(this: ComponentActionHandlerThis, { page, action = "main", data }) {
                return await this.goToComponent({ component: page, action, data, type: "page" });
            },
            async goToPlugin(this: ComponentActionHandlerThis, { plugin, action = "main", data }) {
                return await this.goToComponent({ component: plugin, action, data, type: "plugin" });
            },
            async goToAction(this: ComponentActionHandlerThis, { action, data }) {
                let _this: ComponentActionHandlerThis = this;
                let current_page = loadedComponents.find(x => x.id == _this.id);
                let page_action = current_page.actions[action];
                if (page_action) {
                    await db.setValue(_this.ctx, "step", _this.id + "�" + action);
                    let action_fn = extractHandler(page_action);
                    try {
                        return await action_fn.bind({ ..._this, ...{ id: _this.id } })({ ctx: _this.ctx, data });
                    } catch (error) {
                        console.error("goToAction error", error);
                        return null;
                    }
                } else {
                    throw new Error("goToAction() action not found: " + action);
                }
            },
            async clearChat(this: ComponentActionHandlerThis) {
                let _this: ComponentActionHandlerThis = this;
                return await db.messages.removeMessages(_this.ctx);
            },
            user: function (this: ComponentActionHandlerThis) {
                let _this: ComponentActionHandlerThis = this;

                return {
                    async get() {
                        let chat_id = _this.ctx.chatId;
                        return db.user.data.get(chat_id);
                    },
                    list: async () => db.users.list(),
                    getValue: async (key) => db.getValue(_this.ctx, key),
                    setValue: async (key, value) => db.setValue(_this.ctx, key, value),
                    removeValue: async (key) => db.removeValue(_this.ctx, key),
                    destroy: async () => db.user.destroy(_this.ctx.chatId),
                    collection: db.user.collection(_this.ctx, String(_this.ctx.chatId)),
                }
            },
            userMethods: async function (this: ComponentActionHandlerThis, { user_id }) {
                let _this: ComponentActionHandlerThis = this;

                let userBinding: ComponentActionHandlerThis;
                let lastUserFrom = await db.getValue(user_id, "from");
                let ctx: TBFContext = {
                    ..._this.ctx,
                    update: undefined,
                    telegram: _this.ctx.telegram,
                    from: lastUserFrom
                } as TBFContext;
                if (ctx.chatId) ctx.chatId = user_id;
                if (ctx.chat) ctx.chat.id = user_id;
                userBinding = {
                    ...binding,
                    ctx
                }

                return {
                    async send(args) {
                        return binding.send.bind(userBinding)(args);
                    },
                    async update(args) {
                        return binding.update.bind(userBinding)(args);
                    },
                    async goToPage(args) {
                        return binding.goToPage.bind(userBinding)(args);
                    },
                    async goToPlugin(args) {
                        return binding.goToPlugin.bind(userBinding)(args);
                    },
                    async goToAction(args) {
                        return binding.goToAction.bind(userBinding)(args);
                    },
                    async goToComponent(args) {
                        return binding.goToComponent.bind(userBinding)(args);
                    },
                    async clearChat() {
                        return binding.clearChat.bind(userBinding)();
                    },
                    async sendMediaGroup(args) {
                        return binding.sendMediaGroup.bind(userBinding)(args);
                    },
                    getCurrentRoute: async () => {
                        let step = await db.getValue(user_id, "step");
                        let [page, action] = step.split("�");
                        return { page, action };
                    }
                }
            }
        }
        if (pageObject?.actions?.main) {
            let main_fn = extractHandler(pageObject.actions.main);
            main_fn.bind(binding);
        }
        if (!pageObject.onCallbackQuery) {
            pageObject.onCallbackQuery = async (ctx: TBFContext) => {
                pageObject.ctx = ctx;
                try {
                    let ctx_action = ctx.routing.action;
                    if (!ctx_action) ctx_action = "main";
                    let action = pageObject.actions[ctx_action];
                    if (action) {
                        if (action.clearChat) await db.messages.removeMessages(ctx);
                        let action_fn = extractHandler(action);
                        await db.setValue(ctx, "step", pageObject.id + "�" + ctx_action);
                        await action_fn.bind({ ...binding, ctx })({ ctx, data: ctx.routing.data });
                    } else {
                        throw ("action not found: " + ctx_action);
                    }
                } catch (error) {
                    console.error(`onCallbackQuery ERROR ON PAGE "${pageObject.id}":`, error);
                }
            }
        }
        if (!pageObject.onMessage) {
            pageObject.onMessage = async (ctx: TBFContext) => {
                if (!ctx.routing.message) return;
                if (config.debug) console.log("[onMessage] Message:", ctx.routing.message);
                let action = ctx.routing.action;
                try {
                    let handler = pageObject.actions[action].messageHandler;
                    await db.messages.addToRemoveMessages(ctx, ctx.message, true);
                    if (config.debug) console.log("[onMessage] messageHandler:", handler);
                    if (handler) {
                        if (handler.clearChat) await db.messages.removeMessages(ctx);
                        if (ctx.from) {
                            await db.setValue(ctx, "from", ctx.from);
                        }
                        let handler_fn = extractHandler(handler);
                        let result = await handler_fn.bind({ ...binding, ctx })({
                            ctx,
                            text: "text" in ctx.message ? ctx.message.text : undefined,
                            photo: "photo" in ctx.message ? ctx.message.photo : undefined,
                            video: "video" in ctx.message ? ctx.message.video : undefined,
                            animation: "animation" in ctx.message ? ctx.message.animation : undefined,
                            document: "document" in ctx.message ? ctx.message.document : undefined,
                            voice: "voice" in ctx.message ? ctx.message.voice : undefined,
                            audio: "audio" in ctx.message ? ctx.message.audio : undefined,
                            poll: "poll" in ctx.message ? ctx.message.poll : undefined,
                            sticker: "sticker" in ctx.message ? ctx.message.sticker : undefined,
                            location: "location" in ctx.message ? ctx.message.location : undefined,
                            contact: "contact" in ctx.message ? ctx.message.contact : undefined,
                            venue: "venue" in ctx.message ? ctx.message.venue : undefined,
                            game: "game" in ctx.message ? ctx.message.game : undefined,
                            invoice: "invoice" in ctx.message ? ctx.message.invoice : undefined,
                            dice: "dice" in ctx.message ? ctx.message.dice : undefined,
                            caption: "caption" in ctx.message ? ctx.message.caption : undefined,
                        });
                        if (typeof result === "boolean") {
                            if (!result) {
                                await db.messages.removeMessages(ctx, true);
                            }
                        }
                        if (config.debug) console.log("[onMessage]: Message", ctx.message);
                    } else {
                        await db.messages.removeMessages(ctx, true);
                    }
                } catch (error) {
                    console.error(`onMessage ERROR ON PAGE "${pageObject.id}":`, error);
                }
            }
        }
        if (!pageObject.call) {
            pageObject.call = async (ctx) => {
                if (config.debug) console.log("[call]", pageObject.id, ctx.routing);
                if (ctx.routing.type == 'callback_query') await pageObject.onCallbackQuery(ctx);
                if (ctx.routing.type == 'message') await pageObject.onMessage(ctx);
            }
        }
        if (!pageObject.open) pageObject.open = async function ({ ctx, data, action }: { ctx: TBFContext, data: any, action: string }) {
            if (ctx.from) {
                await db.setValue(ctx, "from", ctx.from);
            }
            let act = action || 'main';
            let action_fn = extractHandler(pageObject.actions[act]);
            await db.messages.removeMessages(ctx);
            await db.setValue(ctx, "step", pageObject.id + "�" + act);
            await action_fn.bind({ ...binding, ctx })({ ctx, data });
        }
        components.push({ ...pageObject, type: componentType });
    }

    return { components }
}

export default (
    { db, config }: { db: DB, config: TBFConfig }
) => {
    let paginator: PaginatorReturn = Paginator({ config });

    let pages_components = paginator.list("pages")
    let pages = loader({ db, config, inputComponents: pages_components, componentType: 'page' }).components;
    loadedComponents.push(...pages);
    console.log("✅", `Loader: ${pages.length} ${pages.length == 1 ? 'page' : 'pages'} loaded!`);

    let plugins_components = paginator.list("plugins")
    let plugins = loader({ db, config, inputComponents: plugins_components, componentType: 'plugin' }).components;
    loadedComponents.push(...plugins);
    console.log("✅", `Loader: ${plugins.length} ${plugins.length == 1 ? 'plugin' : 'plugins'} loaded!`);

    return { pages, plugins, paginator };
}