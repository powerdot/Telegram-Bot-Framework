"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_packer_1 = __importDefault(require("./data_packer"));
const paginator_1 = __importDefault(require("./paginator"));
function loader({ db, config, inputComponents, componentType, loadedComponents, chatActionManager }) {
    async function sendApiMessage(binding, method, payload) {
        const result = await binding.api(method, payload);
        const messages = Array.isArray(result) ? result : [result];
        const trackable = messages.filter(message => message && typeof message === "object" && "message_id" in message);
        if (trackable.length > 0)
            await db.messages.addToRemoveMessages(binding.ctx, trackable, false);
        return result;
    }
    async function removeMessageWrapper(sendKey, args = []) {
        let sent = await this.ctx.telegram[sendKey](this.ctx.chatId, ...args);
        await db.messages.addToRemoveMessages(this.ctx, sent, false);
        return sent;
    }
    function routeToAction(ctx, id, action = 'main', data) {
        return new Promise(async (resolve, reject) => {
            let parsedData = data_packer_1.default.packData(data);
            let compiled = `${id}�${action}${parsedData ? ('�' + parsedData) : ''}`;
            let compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
            if (compiled_bytes_length > 64) {
                // save to db under user
                let messagespace = (ctx.callbackQuery?.message?.message_id || ctx.message?.message_id).toString();
                let uniqid = Math.floor(Math.random() * 99999).toString();
                let tempdata_identifier = 'X' + messagespace + "." + uniqid;
                await db.tempData.add(ctx.chatId, messagespace, uniqid, data);
                compiled = `${id}�${action}�${tempdata_identifier}`;
                compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
                if (compiled_bytes_length > 64) {
                    return reject(new Error(`Data is too long. Allowed 64 bytes. Now is ${compiled_bytes_length}.\nTry shortening the title of page or action or cut sending data.\n${compiled}`));
                }
            }
            return resolve(compiled);
        });
    }
    let parseButtons = function ({ ctx, id, buttons = [] }) {
        return new Promise(async (resolve, reject) => {
            let inline_buttons = [];
            for (let row of buttons) {
                if (!row)
                    continue;
                let new_row = [];
                for (let button of row) {
                    let callback_data;
                    let url;
                    let component_name = button.page || button.plugin;
                    if (button.action && component_name) {
                        callback_data = await routeToAction(ctx, component_name, button.action.toString(), button.data);
                    }
                    else {
                        if (button.action) {
                            if (typeof button.action == "function") {
                                callback_data = button.action();
                            }
                            else {
                                callback_data = await routeToAction(ctx, id, button.action, button.data);
                            }
                        }
                        if (component_name) {
                            callback_data = await routeToAction(ctx, component_name, 'main', button.data);
                        }
                        if (button.url) {
                            url = button.url.indexOf("http") == 0 ? button.url : config.webServer.address + button.url;
                            if (config.debug)
                                console.log("[parseButtons] url:", url);
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
            if (config.debug)
                console.log("[parseButtons] inline_buttons:", inline_buttons);
            return resolve(inline_buttons);
        });
    };
    function extractHandler(action) {
        let action_fn = typeof action == "function" ? action : action.handler;
        return action_fn;
    }
    async function runAction(action, actionBinding, callback) {
        const chatAction = action?.chatAction;
        if (!chatAction)
            return callback();
        return actionBinding.withChatAction(chatAction, async () => callback(), action.chatActionOptions);
    }
    let components = [];
    for (let page of inputComponents) {
        let pageObject;
        try {
            pageObject = page.module({
                db,
                config,
                parseButtons
            });
            if (!pageObject.id)
                pageObject.id = page.id;
        }
        catch (error) {
            console.error('📛', "Component loading error:", page.path, error);
            continue;
        }
        if (loadedComponents.find(x => x.id == pageObject.id)) {
            console.error('📛', "Component with same id:", pageObject.id, '- skipped', page.path);
            continue;
        }
        let binding = {
            id: pageObject.id,
            type: pageObject.type,
            ctx: null,
            async send({ text = "", buttons = [], keyboard = [], options: extraOptions = {} }) {
                let _this = this;
                if (text === undefined)
                    throw new Error("send() text is empty");
                let options = {
                    ...extraOptions,
                    reply_markup: {
                        ...(extraOptions.reply_markup || {}),
                        inline_keyboard: [],
                        keyboard: [],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                };
                if (buttons.length > 0) {
                    let inline_buttons = await parseButtons({ ctx: _this.ctx, id: _this.id, buttons });
                    options.reply_markup.inline_keyboard = inline_buttons;
                }
                else {
                    options.reply_markup.inline_keyboard = [];
                }
                if (keyboard.length > 0) {
                    let reply_keyboard = keyboard;
                    options.reply_markup.keyboard = reply_keyboard;
                }
                else {
                    options.reply_markup.keyboard = [];
                }
                try {
                    let message = await _this.ctx.telegram.sendMessage(_this.ctx.chatId, text, {
                        ...options,
                        parse_mode: extraOptions.parse_mode ?? 'HTML'
                    });
                    await db.messages.addToRemoveMessages(_this.ctx, [message], false);
                    return message;
                }
                catch (error) {
                    console.error(error);
                }
            },
            async reply(args) {
                const messageId = this.ctx.message?.message_id ?? this.ctx.callbackQuery?.message?.message_id;
                return this.send({
                    ...args,
                    options: {
                        ...args.options,
                        reply_parameters: messageId ? { message_id: messageId, ...args.options?.reply_parameters } : undefined,
                    },
                });
            },
            async api(method, payload = {}) {
                return this.ctx.telegram.callApi(method, payload);
            },
            async sendPhoto({ photo, options = {} }) {
                return sendApiMessage(this, "sendPhoto", { chat_id: this.ctx.chatId, photo, ...options });
            },
            async sendVideo({ video, options = {} }) {
                return sendApiMessage(this, "sendVideo", { chat_id: this.ctx.chatId, video, ...options });
            },
            async sendAnimation({ animation, options = {} }) {
                return sendApiMessage(this, "sendAnimation", { chat_id: this.ctx.chatId, animation, ...options });
            },
            async sendAudio({ audio, options = {} }) {
                return sendApiMessage(this, "sendAudio", { chat_id: this.ctx.chatId, audio, ...options });
            },
            async sendDocument({ document, options = {} }) {
                return sendApiMessage(this, "sendDocument", { chat_id: this.ctx.chatId, document, ...options });
            },
            async sendVoice({ voice, options = {} }) {
                return sendApiMessage(this, "sendVoice", { chat_id: this.ctx.chatId, voice, ...options });
            },
            async sendSticker({ sticker, options = {} }) {
                return sendApiMessage(this, "sendSticker", { chat_id: this.ctx.chatId, sticker, ...options });
            },
            async sendLocation({ latitude, longitude, options = {} }) {
                return sendApiMessage(this, "sendLocation", { chat_id: this.ctx.chatId, latitude, longitude, ...options });
            },
            async sendPoll({ question, options, extra = {} }) {
                return sendApiMessage(this, "sendPoll", { chat_id: this.ctx.chatId, question, options, ...extra });
            },
            async sendChatAction(action, options = {}) {
                return this.api("sendChatAction", { chat_id: this.ctx.chatId, action, ...options });
            },
            async withChatAction(action, callback, options = {}) {
                const { intervalDuration = 4000, ...apiOptions } = options;
                const sendStatus = async () => {
                    try {
                        await this.sendChatAction(action, apiOptions);
                    }
                    catch (error) {
                        if (config.debug)
                            console.warn("[withChatAction] Unable to send chat action:", error);
                    }
                };
                await sendStatus();
                const timer = setInterval(sendStatus, intervalDuration);
                timer.unref?.();
                const unregister = chatActionManager.register(this.ctx, () => clearInterval(timer));
                try {
                    return await callback();
                }
                finally {
                    clearInterval(timer);
                    unregister();
                }
            },
            async react(reaction, options = {}) {
                const messageId = this.ctx.message?.message_id ?? this.ctx.callbackQuery?.message?.message_id;
                if (!messageId)
                    throw new Error("react() requires a message context or message_id");
                const reactions = (Array.isArray(reaction) ? reaction : [reaction]).map(item => typeof item === "string" ? { type: "emoji", emoji: item } : item);
                return this.api("setMessageReaction", {
                    chat_id: this.ctx.chatId,
                    message_id: messageId,
                    reaction: reactions,
                    ...options,
                });
            },
            async update({ text = "", buttons = [], keyboard = [] }) {
                if (text === undefined)
                    throw new Error("update() text is empty");
                let options = {
                    reply_markup: {
                        inline_keyboard: [],
                        keyboard: []
                    }
                };
                if (buttons.length > 0) {
                    let inline_buttons = await parseButtons({ ctx: this.ctx, id: this.id, buttons });
                    options.reply_markup.inline_keyboard = inline_buttons;
                }
                else {
                    options.reply_markup.inline_keyboard = [];
                }
                if (buttons.length > 0) {
                    let reply_keyboard = keyboard;
                    options.reply_markup.keyboard = reply_keyboard;
                }
                else {
                    options.reply_markup.keyboard = [];
                }
                try {
                    if (this.ctx.routing.isMessageFromUser) {
                        // get last bot's message and update it
                        let lastBotMessage = await db.messages.bot.getLastMessage(this.ctx);
                        if (lastBotMessage) {
                            if (config.debug)
                                console.log("[update] message to update:", lastBotMessage);
                            let edited;
                            edited = await this.ctx.telegram.editMessageText(this.ctx.chatId, lastBotMessage.messageId, undefined, text, { ...options, parse_mode: 'HTML' });
                            await db.messages.removeMessages(this.ctx, true);
                            return edited;
                        }
                    }
                }
                catch (e) {
                    console.warn("⚠️", "Warning:", e);
                }
                try {
                    return await this.ctx.editMessageText(text, { ...options, parse_mode: 'HTML' });
                }
                catch (error) {
                    console.error("update error", error);
                    return null;
                }
            },
            async sendMediaGroup({ media = [], options = {} }) {
                if (media.length === 0)
                    throw new Error("sendMediaGroup() media is empty");
                try {
                    return await removeMessageWrapper.bind(this)('sendMediaGroup', [media, options]);
                }
                catch (error) {
                    console.error("sendMediaGroup error", error);
                    return null;
                }
            },
            async goToComponent({ component, action = "main", data, type = "" }) {
                if (!type)
                    return Error("goToComponent() type is empty");
                let _this = this;
                let found_component = loadedComponents.find(x => x.id == component && x.type == type);
                if (found_component) {
                    if (config.chatActions?.stopOnNavigation)
                        chatActionManager.stop(_this.ctx);
                    try {
                        return await found_component.open?.({ ctx: _this.ctx, data, action });
                    }
                    catch (error) {
                        console.error("goToComponent error", error);
                        return null;
                    }
                }
                else {
                    throw new Error("goToComponent() component not found: " + component);
                }
            },
            async goToPage({ page, action = "main", data }) {
                return await this.goToComponent({ component: page, action, data, type: "page" });
            },
            async goToPlugin({ plugin, action = "main", data }) {
                return await this.goToComponent({ component: plugin, action, data, type: "plugin" });
            },
            async goToAction({ action, data }) {
                let _this = this;
                let current_page = loadedComponents.find(x => x.id == _this.id);
                let page_action = current_page.actions[action];
                if (page_action) {
                    if (config.chatActions?.stopOnNavigation)
                        chatActionManager.stop(_this.ctx);
                    await db.setValue(_this.ctx, "step", _this.id + "�" + action);
                    let action_fn = extractHandler(page_action);
                    try {
                        const actionBinding = { ..._this, ...{ id: _this.id } };
                        return await runAction(page_action, actionBinding, () => action_fn.bind(actionBinding)({ ctx: _this.ctx, data }));
                    }
                    catch (error) {
                        console.error("goToAction error", error);
                        return null;
                    }
                }
                else {
                    throw new Error("goToAction() action not found: " + action);
                }
            },
            async clearChat() {
                let _this = this;
                return await db.messages.removeMessages(_this.ctx);
            },
            user: function () {
                let _this = this;
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
                };
            },
            userMethods: async function ({ user_id }) {
                let _this = this;
                let userBinding;
                let lastUserFrom = await db.getValue(user_id, "from");
                let ctx = {
                    ..._this.ctx,
                    update: undefined,
                    telegram: _this.ctx.telegram,
                    from: lastUserFrom
                };
                if (ctx.chatId)
                    ctx.chatId = user_id;
                if (ctx.chat)
                    ctx.chat.id = user_id;
                userBinding = {
                    ...binding,
                    ctx
                };
                return {
                    async send(args) {
                        return binding.send.bind(userBinding)(args);
                    },
                    async reply(args) {
                        return binding.reply.bind(userBinding)(args);
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
                    async sendPhoto(args) {
                        return binding.sendPhoto.bind(userBinding)(args);
                    },
                    async sendVideo(args) {
                        return binding.sendVideo.bind(userBinding)(args);
                    },
                    async sendAnimation(args) {
                        return binding.sendAnimation.bind(userBinding)(args);
                    },
                    async sendAudio(args) {
                        return binding.sendAudio.bind(userBinding)(args);
                    },
                    async sendDocument(args) {
                        return binding.sendDocument.bind(userBinding)(args);
                    },
                    async sendVoice(args) {
                        return binding.sendVoice.bind(userBinding)(args);
                    },
                    async sendSticker(args) {
                        return binding.sendSticker.bind(userBinding)(args);
                    },
                    async sendLocation(args) {
                        return binding.sendLocation.bind(userBinding)(args);
                    },
                    async sendPoll(args) {
                        return binding.sendPoll.bind(userBinding)(args);
                    },
                    async sendChatAction(action, options) {
                        return binding.sendChatAction.bind(userBinding)(action, options);
                    },
                    async withChatAction(action, callback, options) {
                        return binding.withChatAction.bind(userBinding)(action, callback, options);
                    },
                    async react(reaction, options) {
                        return binding.react.bind(userBinding)(reaction, options);
                    },
                    async api(method, payload) {
                        return binding.api.bind(userBinding)(method, payload);
                    },
                    getCurrentRoute: async () => {
                        let step = await db.getValue(user_id, "step");
                        let [page, action] = step.split("�");
                        return { page, action };
                    }
                };
            }
        };
        if (pageObject?.actions?.main) {
            let main_fn = extractHandler(pageObject.actions.main);
            main_fn.bind(binding);
        }
        const prepareOpen = async (ctx, clearChat) => {
            if (ctx.from) {
                await db.setValue(ctx, "from", ctx.from);
            }
            const shouldClearChat = clearChat ?? pageObject.clearChatOnOpen ?? config.clearChatOnPageOpen ?? true;
            if (shouldClearChat)
                await db.messages.removeMessages(ctx);
        };
        if (!pageObject.onCallbackQuery) {
            pageObject.onCallbackQuery = async (ctx) => {
                pageObject.ctx = ctx;
                try {
                    let ctx_action = ctx.routing.action;
                    if (!ctx_action)
                        ctx_action = "main";
                    let action = pageObject.actions[ctx_action];
                    if (action) {
                        if (action.clearChat)
                            await db.messages.removeMessages(ctx);
                        let action_fn = extractHandler(action);
                        await db.setValue(ctx, "step", pageObject.id + "�" + ctx_action);
                        const actionBinding = { ...binding, ctx };
                        await runAction(action, actionBinding, () => action_fn.bind(actionBinding)({ ctx, data: ctx.routing.data }));
                    }
                    else {
                        throw ("action not found: " + ctx_action);
                    }
                }
                catch (error) {
                    console.error(`onCallbackQuery ERROR ON PAGE "${pageObject.id}":`, error);
                }
            };
        }
        if (!pageObject.onMessage) {
            pageObject.onMessage = async (ctx) => {
                if (!ctx.routing.message)
                    return;
                if (config.debug)
                    console.log("[onMessage] Message:", ctx.routing.message);
                let action = ctx.routing.action;
                try {
                    let handler = pageObject.actions[action].messageHandler;
                    await db.messages.addToRemoveMessages(ctx, ctx.message, true);
                    if (config.debug)
                        console.log("[onMessage] messageHandler:", handler);
                    if (handler) {
                        if (handler.clearChat)
                            await db.messages.removeMessages(ctx);
                        if (ctx.from) {
                            await db.setValue(ctx, "from", ctx.from);
                        }
                        let handler_fn = extractHandler(handler);
                        const actionBinding = { ...binding, ctx };
                        let result = await runAction(handler, actionBinding, () => handler_fn.bind(actionBinding)({
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
                        }));
                        if (typeof result === "boolean") {
                            if (!result) {
                                await db.messages.removeMessages(ctx, true);
                            }
                        }
                        if (config.debug)
                            console.log("[onMessage]: Message", ctx.message);
                    }
                    else {
                        await db.messages.removeMessages(ctx, true);
                    }
                }
                catch (error) {
                    console.error(`onMessage ERROR ON PAGE "${pageObject.id}":`, error);
                }
            };
        }
        if (!pageObject.call) {
            pageObject.call = async (ctx) => {
                if (config.debug)
                    console.log("[call]", pageObject.id, ctx.routing);
                if (ctx.routing.type == 'callback_query') {
                    const previousComponent = ctx.routing.step?.split("�")[0];
                    if (previousComponent !== pageObject.id)
                        await prepareOpen(ctx);
                    await pageObject.onCallbackQuery(ctx);
                }
                if (ctx.routing.type == 'message')
                    await pageObject.onMessage(ctx);
                const eventHandler = pageObject.events?.[ctx.updateType];
                if (eventHandler)
                    await eventHandler.bind({ ...binding, ctx })(ctx);
            };
        }
        if (!pageObject.open)
            pageObject.open = async function ({ ctx, data, action, clearChat, }) {
                let act = action || 'main';
                let action_fn = extractHandler(pageObject.actions[act]);
                await prepareOpen(ctx, clearChat);
                await db.setValue(ctx, "step", pageObject.id + "�" + act);
                const actionBinding = { ...binding, ctx };
                return await runAction(pageObject.actions[act], actionBinding, () => action_fn.bind(actionBinding)({ ctx, data }));
            };
        components.push({ ...pageObject, type: componentType });
    }
    return { components };
}
exports.default = ({ db, config }) => {
    let loadedComponents = [];
    let paginator = (0, paginator_1.default)({ config });
    const activeChatActions = new WeakMap();
    const chatActionManager = {
        register(ctx, stop) {
            const stops = activeChatActions.get(ctx) ?? new Set();
            stops.add(stop);
            activeChatActions.set(ctx, stops);
            return () => {
                stops.delete(stop);
                if (stops.size === 0)
                    activeChatActions.delete(ctx);
            };
        },
        stop(ctx) {
            const stops = activeChatActions.get(ctx);
            if (!stops)
                return;
            activeChatActions.delete(ctx);
            for (const stop of stops)
                stop();
        },
    };
    let pages_components = paginator.list("pages");
    let pages = loader({ db, config, inputComponents: pages_components, componentType: 'page', loadedComponents, chatActionManager }).components;
    loadedComponents.push(...pages);
    console.log("✅", `Loader: ${pages.length} ${pages.length == 1 ? 'page' : 'pages'} loaded!`);
    let plugins_components = paginator.list("plugins");
    let plugins = loader({ db, config, inputComponents: plugins_components, componentType: 'plugin', loadedComponents, chatActionManager }).components;
    loadedComponents.push(...plugins);
    console.log("✅", `Loader: ${plugins.length} ${plugins.length == 1 ? 'plugin' : 'plugins'} loaded!`);
    return { pages, plugins, paginator, stopChatActions: chatActionManager.stop };
};
//# sourceMappingURL=page_loader.js.map