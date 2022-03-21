import type {
    TBFContext,
    Page,
    PageActionHandlerThis,
    MessageButtons,
    PageActionData,
    DB,
    PageExport,
    PageActionHandler,
    TBFConfig
} from "./types"

import dataPacker from "./data_packer"

module.exports = (
    { db, config }: { db: DB, config: TBFConfig }
) => {
    let paginator = require("./paginator")({ config });

    function routeToAction(id: string, action: string = 'main', data: PageActionData): string {
        let parsedData = dataPacker.packData(data);

        let compiled = `${id}�${action}${parsedData ? ('�' + parsedData) : ''}`;

        let compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
        if (compiled_bytes_length > 64) {
            throw new Error(`Data is too long. Allowed 64 bytes. Now is ${compiled_bytes_length}.\nTry shortening the title of page or action or cut sending data.\n${compiled}`);
        }
        // console.log('routeToAction data', compiled, compiled_bytes_length)

        return compiled;
    }

    function parseButtons(id: string, buttons: MessageButtons = []) {
        let inline_buttons = [];
        for (let row of buttons) {
            if (!row) continue;
            let new_row = [];
            for (let button of row) {
                let callback_data = "";
                if (button.action && button.page) {
                    callback_data = routeToAction(button.page, button.action.toString(), button.data);
                } else {
                    if (button.action) {
                        if (typeof button.action == "function") {
                            callback_data = button.action();
                        } else {
                            callback_data = routeToAction(id, button.action, button.data);
                        }
                    }
                    if (button.page) {
                        callback_data = routeToAction(button.page, 'main', button.data);
                    }
                }
                new_row.push({
                    text: button.text,
                    callback_data
                });
            }
            inline_buttons.push(new_row);
        }
        return inline_buttons;
    }

    function extractHandler(action): PageActionHandler {
        let action_fn = typeof action == "function" ? action : action.handler;
        return action_fn;
    }

    let _pages: Array<{
        module: PageExport,
        path: string,
    }> = paginator.list();

    let pages: Array<Page> = [];

    for (let page of _pages) {
        let pageObject: Page;
        try {
            pageObject = page.module({
                db,
                config,
                paginator,
            })
        } catch (error) {
            console.log('📛', "Page loading error:", page.path, error);
            continue;
        }
        if (!pageObject.id) {
            console.error('📛', "Page without id:", page.path);
            continue;
        }
        if (pages.find(x => x.id == pageObject.id)) {
            console.error('📛', "Page with same id:", pageObject.id, '- skipped', page.path);
            continue;
        }
        let binding: PageActionHandlerThis = {
            id: pageObject.id,
            ctx: null,
            async send({ text = "", buttons = [], keyboard = [] }) {
                if (text === undefined) throw new Error("send() text is empty");
                let options = {
                    reply_markup: {
                        inline_keyboard: [],
                        keyboard: []
                    }
                };
                if (buttons.length > 0) {
                    let inline_buttons = parseButtons(this.id, buttons);
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
                let message = await this.ctx.telegram.sendMessage(this.ctx.chatId, text, options);
                db.messages.addToRemoveMessages(this.ctx, [message], false)
                return message;
            },
            async update({ text = "", buttons = [], keyboard = [] }) {
                let _this: PageActionHandlerThis = this;
                if (text === undefined) throw new Error("update() text is empty");

                let options = {
                    reply_markup: {
                        inline_keyboard: [],
                        keyboard: []
                    }
                };
                if (buttons.length > 0) {
                    let inline_buttons = parseButtons(_this.id, buttons);
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
                            options
                        );
                        await db.messages.removeMessages(_this.ctx, true);
                        return edited;
                    }
                }

                return await this.ctx.editMessageText(text, options);
            },
            async goToPage(page, action = "main") {
                let _this: PageActionHandlerThis = this;
                let found_page = pages.find(x => x.id == page);
                if (found_page) {
                    let action_fn = extractHandler(found_page.actions[action]);
                    action_fn.bind({ ..._this, ...{ id: page } })({ ctx: _this.ctx });
                } else {
                    throw new Error("goToPage() page not found: " + page);
                }
            },
            async goToAction(action) {
                let _this: PageActionHandlerThis = this;
                let current_page = pages.find(x => x.id == _this.id);
                let page_action = current_page.actions[action];
                if (page_action) {
                    let action_fn = extractHandler(page_action);
                    action_fn.bind({ ..._this, ...{ id: _this.id } })({ ctx: _this.ctx });
                } else {
                    throw new Error("goToAction() action not found: " + action);
                }
            },
            async clearChat() {
                let _this: PageActionHandlerThis = this;
                await db.messages.removeMessages(_this.ctx);
            },
            user: function ({ user_id = false } = { user_id: false }) {
                let _this: PageActionHandlerThis = this;
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
                        await action_fn.bind({ ...binding, ctx })({ ctx, data: ctx.routing.data });
                        await db.setValue(ctx, "step", pageObject.id + "�" + ctx_action);
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
                let page = ctx.routing.page;
                let action = ctx.routing.action;
                try {
                    let text_handler = pageObject.actions[action].textHandler;
                    await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                    if (text_handler) {
                        if (text_handler.clearChat) await db.messages.removeMessages(ctx);
                        let text_handler_fn = extractHandler(text_handler);
                        await text_handler_fn.bind({ ...binding, ctx })({ ctx, text: ctx.message.text });
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
        pages.push(pageObject);
    }
    console.log("✅", `Loader: ${pages.length} ${pages.length == 1 ? 'page' : 'pages'} loaded!`);

    return { pages, paginator }
}