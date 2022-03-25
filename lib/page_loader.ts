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
                console.log("tempdata_identifier", tempdata_identifier)
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
                            url = button.url;
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
        } catch (error) {
            console.log('📛', "Component loading error:", page.path, error);
            continue;
        }
        if (!pageObject.id) {
            console.error('📛', "Component without id:", page.path);
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
            async send(this: ComponentActionHandlerThis, { text = "", buttons = [], keyboard = [], images = [] }) {
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
                    let inline_buttons = await parseButtons({ ctx: this.ctx, id: this.id, buttons });
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

                if (images.length) {
                    console.log("images to send:", images);
                    return await this.ctx.replyWithMediaGroup(
                        images.map(x => ({ type: 'photo', media: x }))
                    )
                }
                let message = await this.ctx.telegram.sendMessage(this.ctx.chatId, text, { ...options, parse_mode: 'HTML' });
                db.messages.addToRemoveMessages(this.ctx, [message], false)
                return message;
            },
            async update(this: ComponentActionHandlerThis, { text = "", buttons = [], keyboard = [] }) {
                let _this: ComponentActionHandlerThis = this;
                if (text === undefined) throw new Error("update() text is empty");

                let options = {
                    reply_markup: {
                        inline_keyboard: [],
                        keyboard: []
                    }
                };
                if (buttons.length > 0) {
                    let inline_buttons = await parseButtons({ ctx: _this.ctx, id: _this.id, buttons });
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

                if (_this.ctx.routing.isMessageFromUser) {
                    // get last bot's message and update it
                    let lastBotMessage = await db.messages.bot.getLastMessage(_this.ctx);
                    if (lastBotMessage) {
                        console.log("message to update:", lastBotMessage);
                        let edited = await _this.ctx.telegram.editMessageText(
                            _this.ctx.chatId,
                            lastBotMessage.messageId,
                            undefined,
                            text,
                            { ...options, parse_mode: 'HTML' }
                        );
                        await db.messages.removeMessages(_this.ctx, true);
                        return edited;
                    }
                }

                return await this.ctx.editMessageText(text, { ...options, parse_mode: 'HTML' });
            },
            async goToComponent(this: ComponentActionHandlerThis, { component, action = "main", data, type = "" }) {
                if (!type) return Error("goToComponent() type is empty");
                let _this: ComponentActionHandlerThis = this;
                let found_component = loadedComponents.find(x => x.id == component && x.type == type);
                if (found_component) {
                    await db.setValue(_this.ctx, "step", component + "�" + action);
                    let action_fn = extractHandler(found_component.actions[action]);
                    action_fn.bind({ ..._this, ...{ id: component } })({ ctx: _this.ctx, data });
                } else {
                    throw new Error("goToComponent() component not found: " + component);
                }
            },
            async goToPage(this: ComponentActionHandlerThis, { page, action = "main", data }) {
                this.goToComponent({ component: page, action, data, type: "page" });
            },
            async goToPlugin(this: ComponentActionHandlerThis, { plugin, action = "main", data }) {
                this.goToComponent({ component: plugin, action, data, type: "plugin" });
            },
            async goToAction(this: ComponentActionHandlerThis, { action, data }) {
                let _this: ComponentActionHandlerThis = this;
                let current_page = loadedComponents.find(x => x.id == _this.id);
                // console.log("current_page:", components, current_page, _this);
                let page_action = current_page.actions[action];
                if (page_action) {
                    await db.setValue(_this.ctx, "step", _this.id + "�" + action);
                    let action_fn = extractHandler(page_action);
                    action_fn.bind({ ..._this, ...{ id: _this.id } })({ ctx: _this.ctx, data });
                } else {
                    throw new Error("goToAction() action not found: " + action);
                }
            },
            async clearChat(this: ComponentActionHandlerThis) {
                let _this: ComponentActionHandlerThis = this;
                await db.messages.removeMessages(_this.ctx);
            },
            user: function (this: ComponentActionHandlerThis, { user_id = false } = { user_id: false }) {
                let _this: ComponentActionHandlerThis = this;
                return {
                    async get() {
                        let chat_id = user_id || _this.ctx.chatId;
                        return db.user.data.get(chat_id);
                    },
                    list: async () => db.users.list(),
                    getValue: async (key) => db.getValue(user_id || _this.ctx, key),
                    setValue: async (key, value) => db.setValue(user_id || _this.ctx, key, value),
                    removeValue: async (key) => db.removeValue(user_id || _this.ctx, key),
                    destroy: async () => db.user.destroy(user_id || _this.ctx.chatId),
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
                console.log("onMessage:", ctx.routing.message);
                let action = ctx.routing.action;
                try {
                    let handler = pageObject.actions[action].messageHandler;
                    await db.messages.addToRemoveMessages(ctx, ctx.message, true);
                    console.log("messageHandler:", handler);
                    if (handler) {
                        if (handler.clearChat) await db.messages.removeMessages(ctx);
                        let handler_fn = extractHandler(handler);
                        await handler_fn.bind({ ...binding, ctx })({
                            ctx,
                            text: ctx.message.text,
                            photo: ctx.message.photo,
                            video: ctx.message.video,
                            animation: ctx.message.animation,
                            document: ctx.message.document,
                            voice: ctx.message.voice,
                            audio: ctx.message.audio,
                            poll: ctx.message.poll,
                            sticker: ctx.message.sticker,
                            location: ctx.message.location,
                            contact: ctx.message.contact,
                            venue: ctx.message.venue,
                            game: ctx.message.game,
                            invoice: ctx.message.invoice,
                            dice: ctx.message.dice,
                        });
                        console.log("MESSAGE", ctx.message);
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
                console.log("call", pageObject.id, ctx.routing);
                if (ctx.routing.type == 'callback_query') await pageObject.onCallbackQuery(ctx);
                if (ctx.routing.type == 'message') await pageObject.onMessage(ctx);
            }
        }
        if (!pageObject.onOpen) pageObject.onOpen = async () => { }
        if (!pageObject.open) pageObject.open = async function (ctx: TBFContext) {
            let action_fn = extractHandler(pageObject.actions.main);
            await db.messages.removeMessages(ctx);
            await action_fn.bind({ ...binding, ctx })({ ctx });
            await db.setValue(ctx, "step", pageObject.id + "�main");
        }
        components.push({ ...pageObject, type: componentType });
    }

    return { components }
}

module.exports = (
    { db, config }: { db: DB, config: TBFConfig }
) => {
    let paginator: PaginatorReturn = require("./paginator")({ config });

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