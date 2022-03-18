import type {
    TBFContext,
    Page,
    PageActionHandlerThis,
    MessageButtons,
    PageActionData
} from "./types"


let helpers = require("./helpers");

module.exports = ({ db }) => {

    let paginator = require("./paginator")({ db });

    function routeToAction(id, action = 'main', data: PageActionData): string {
        let parsedData = data;
        if (data) {
            let type = typeof data;
            switch (type) {
                case "string":
                    parsedData = "S" + data;
                    break;
                case "number":
                    parsedData = "N" + data.toString();
                    break;
                case "boolean":
                    parsedData = "B" + data.toString();
                    break;
                case "object":
                    parsedData = "O" + JSON.stringify(data);
                    break;
                default:
                    throw new Error("Unsupported data type");
            }
        }

        let compiled = `${id}�${action}${parsedData ? ('�' + parsedData) : ''}`;

        let compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
        if (compiled_bytes_length > 64) {
            throw new Error(`Data is too long. Allowed 64 bytes. Now is ${compiled_bytes_length}.\nTry shortening the title of page or action or cut sending data.`);
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

    function extractHandler(action) {
        let action_fn = typeof action == "function" ? action : action.handler;
        return action_fn;
    }

    let _pages = paginator.list();
    let pages = [];
    for (let page of _pages) {
        let pageObject: Page = page.module({
            db,
            config: require('../config'),
            paginator,
        });
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
                if (!text) throw new Error("send() text is empty");
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
                let message = await this.ctx.telegram.sendMessage(helpers.getChatId(this.ctx), text, options);
                db.messages.addToRemoveMessages(this.ctx, [message], false)
                return message;
            },
            async update({ text = "", buttons = [], keyboard = [] }) {
                if (!text) throw new Error("update() text is empty");
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
                if (buttons.length > 0) {
                    let reply_keyboard = keyboard;
                    options.reply_markup.keyboard = reply_keyboard;
                } else {
                    options.reply_markup.keyboard = [];
                }
                return await this.ctx.editMessageText(text, options);
            },
            async goToPage(page, action = "main") {
                let found_page = pages.find(x => x.id == page);
                if (found_page) {
                    console.log('goToPage found_page', found_page);
                    let action_fn = extractHandler(found_page.actions[action]);
                    action_fn.bind({ ...this, ...{ id: page } })({ ctx: this.ctx });
                } else {
                    throw new Error("goToPage() page not found: " + page);
                }
            },
            async goToAction(action) {
                let current_page = pages.find(x => x.id == this.id);
                let page_action = current_page.actions[action];
                if (page_action) {
                    let action_fn = extractHandler(page_action);
                    action_fn.bind({ ...this, ...{ id: this.id } })({ ctx: this.ctx });
                } else {
                    throw new Error("goToAction() action not found: " + action);
                }
            },
            async clearChat() {
                await db.messages.removeMessages(this.ctx);
            },
            user: function ({ user_id = false } = { user_id: false }) {
                let _this: PageActionHandlerThis = this;
                return {
                    async get() {
                        let chat_id = user_id || helpers.getChatId(_this.ctx);
                        return db.user.data.get(chat_id);
                    },
                    async list() {
                        return db.users.list();
                    },
                    async getValue(key) {
                        return db.getValue(user_id || _this.ctx, key);
                    },
                    async setValue(key, value) {
                        return db.setValue(user_id || _this.ctx, key, value);
                    },
                    async removeValue(key) {
                        return db.removeValue(user_id || _this.ctx, key);
                    },
                    async destroy() {
                        return db.user.destroy(helpers.getChatId(user_id || _this.ctx));
                    },
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
                let callbackData = ctx.CallbackPath ? ctx.CallbackPath.current : false;
                if (!callbackData) return;
                if (callbackData.route != pageObject.id) return false;
                let perms = await paginator.check_requirements(ctx, pageObject.requirements, pageObject.id);
                if (!perms) return;
                try {
                    if (!callbackData.action) callbackData.action = "main";
                    let action = pageObject.actions[callbackData.action];
                    if (action) {
                        let raw_data = callbackData.data ? callbackData.data : "";
                        let data: any;
                        if (raw_data) {
                            let data_type = raw_data[0];
                            let cleared = raw_data.substring(1);
                            switch (data_type) {
                                case "S":
                                    data = cleared;
                                    break;
                                case "N":
                                    data = Number(cleared);
                                    break;
                                case "B":
                                    data = cleared.toLocaleLowerCase() === "true";
                                    break;
                                case "O":
                                    data = JSON.parse(cleared);
                                    break;
                                default:
                                    data = cleared;
                                    break;
                            }
                        }
                        if (action.clearChat) await db.messages.removeMessages(ctx);
                        let action_fn = extractHandler(action);
                        await action_fn.bind({ ...binding, ctx })({ ctx, data });
                        await db.setValue(ctx, "step", pageObject.id + "-" + callbackData.action);
                    } else {
                        throw ("action not found: " + callbackData.action);
                    }
                } catch (error) {
                    console.error(`onCallbackQuery ERROR ON PAGE "${pageObject.id}":`, error);
                }
            }
        }
        if (!pageObject.onMessage) {
            pageObject.onMessage = async (ctx: TBFContext) => {
                pageObject.ctx = ctx;
                if (ctx.updateSubTypes.length != 1 || ctx.updateSubTypes[0] != 'text') return;
                let step = await db.getValue(ctx, 'step');
                let page = step.split("-")[0];
                if (page != pageObject.id) return;
                let action = step.split("-")[1];

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
                if (ctx.updateType == 'callback_query') await pageObject.onCallbackQuery(ctx);
                if (ctx.updateType == 'message') await pageObject.onMessage(ctx);
            }
        }
        if (!pageObject.trigger) {
            pageObject.trigger = async (ctx) => {
                if (ctx.updateType == 'callback_query') await pageObject.onCallbackQuery(ctx);
                if (ctx.updateType == 'message') await pageObject.onMessage(ctx);
            }
        }
        if (!pageObject.onOpen) pageObject.onOpen = async () => { }
        pages.push(pageObject);
    }
    console.log("✅", `Loader: ${pages.length} ${pages.length == 1 ? 'page' : 'pages'} loaded!`);


    return { pages, paginator }
}