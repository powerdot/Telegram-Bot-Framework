require('dotenv').config()
require('module-alias/register');
const Telegraf = require('telegraf');
import type {
    Markup,
    Context,
    TBFContext,
    CallbackPath,
    Page,
    PageActionHandlerThis
} from "../lib/types"
let helpers = require("../lib/helpers");
let keyboard_builder = require("../lib/helpers/keyboard_builder");
let moment = require('moment');
let db = require("../lib/helpers/db.ts");
let paginator = require("../lib/paginator");
let clearAndOpenMainMenu = require('../lib/helpers/clearAndOpenMainMenu');

// Telegram Bot Service
require("../lib/removeCheck")();

function routeToAction(id, action = 'main', data) {
    return `${id}-${action}${data ? ('-' + data) : ''}`;
}

function parseButtons(id, buttons = []) {
    let inline_buttons = [];
    for (let row of buttons) {
        if (!row) continue;
        let new_row = [];
        for (let button of row) {
            let callback_data = "";
            if (button.action) {
                if (typeof button.action == "function") {
                    callback_data = button.action();
                } else {
                    callback_data = routeToAction(id, button.action, button.data);
                }
            }
            if (button.page) callback_data = button.page;
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
        routeToPage: (page_id) => page_id,
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
            return await this.ctx.replyWithMarkdown(text, options);
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
        async goToPage(page) {
            // await this.clearChat();
            let found_page = pages.find(x => x.id == page);
            if (found_page) {
                let action_fn = extractHandler(found_page.actions.main);
                action_fn.bind({ ...this, ...{ id: page } })({ ctx: this.ctx });
            } else {
                throw new Error("goToPage() page not found: " + page);
            }
        },
        async goToAction(action) {
            // await this.clearChat();
            // console.log('goToAction', this.ctx);
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
        pageObject.onCallbackQuery = async (ctx) => {
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
                    if (action.clearChat) await db.messages.removeMessages(ctx);
                    let action_fn = extractHandler(action);
                    await action_fn.bind({ ...binding, ctx })({ ctx });
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
            let id = step.split("-")[0];
            if (id != pageObject.id) return;
            let route = step.split("-")[1];

            try {
                let text_handler = pageObject.actions[route].textHandler;
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
    // console.log("\t✅", pageObject.id, 'page');
}
console.log("✅", `Loader: ${pages.length} ${pages.length == 1 ? 'page' : 'pages'} loaded!`);

let token = process.env.TOKEN;
if (!token) {
    console.log('📛', 'Set token .env');
    process.exit();
} else {
    console.log("ℹ️ ", "Telegram token is set.");
}


// @ts-ignore
let bot: Telegraf;
if (process.env.PROXY) {
    bot = new Telegraf(token, {
        telegram: {
            apiRoot: process.env.PROXY
        }
    });
    console.log("ℹ️ ", "Proxy installed", process.env.PROXY);
} else {
    bot = new Telegraf(token);
    // on connection
    console.log("ℹ️ ", "Bot without proxy");
}

// time selector middleware
bot.use(keyboard_builder.time_keyboard.controller);

// define bot for modules
require("../lib/helpers/users").bot = bot;
require("../lib/helpers/db").bot = bot;

//middleware and functions

async function checkSpecialFunction(oldfunction, ctx, args) {
    let first_arg = args[0];
    let specialFunctions = ['delete'];
    let specialFunction = specialFunctions.filter(x => x == first_arg)[0];
    args = Array.from(args);
    if (specialFunction) args = args.slice(1);
    let a = await oldfunction.apply(null, args);
    switch (specialFunction) {
        case "delete":
            db.messages.addToRemoveMessages(ctx, a, true);
            break;
        default:
            break;
    }
    if (!specialFunction) db.messages.addToRemoveMessages(ctx, a, false);
    return a;
}

bot.use(async (ctx, next) => {
    await db.messages.removeMessages(ctx, true);
    let ctx_keys = Object.keys(ctx);
    for (let ctx_key of ctx_keys) {
        if (ctx_key.indexOf("reply") == 0) {
            let old_func = ctx[ctx_key];
            ctx[ctx_key] = (function (o, c) {
                return function () {
                    return checkSpecialFunction(o, c, arguments);
                }
            })(old_func, ctx)
        }
    }
    return next()
});



// core middlewares


// WAF
let waf_store = {};
bot.use(async function (ctx, next) {
    if (!ctx.update) return next();
    if (!ctx.update.message) return next();
    let user_id = ctx.update.message.from.id;
    if (!waf_store[user_id]) waf_store[user_id] = moment().unix() - 10;
    if (waf_store[user_id] == moment().unix()) {
        console.log(user_id, '📛 waf detector');
        return false;
    }
    waf_store[user_id] = moment().unix();
    return next();
});


bot.use(async function (ctx, next) {
    if (!ctx.update) return next();
    if (!ctx.update.message) return next();
    await db.messages.user.addUserMessage(ctx);
    return next();
});



async function resetUser(ctx) {
    await db.messages.addToRemoveMessages(ctx, ctx.update.message);
    await db.messages.removeMessages(ctx);

    await db.setValue(ctx, "user", ctx.update.message.from);
    await db.setValue(ctx, "step", "main_menu");
    await paginator.clear_requirements_data(ctx); // home_place phone
    await db.setValue(ctx, "last_action", "");
    await db.setValue(ctx, "BOOKING-selected_date", "");
    await db.setValue(ctx, "BOOKING-selected_hour", "");
    await db.setValue(ctx, "BOOKING-selected_minute", "");
    await db.setValue(ctx, 'APIKEY', '');
    await db.setValue(ctx, 'franchise_domain', "");
    await db.setValue(ctx, 'franchise_name', "");
    await db.setValue(ctx, 'user_name', "");
    await db.setValue(ctx, 'shop_name', "");
    await db.setValue(ctx, "next_step", "");
    await db.setValue(ctx, "callback_step", "");
    await db.setValue(ctx, 'selected_shop_name', '');
    await db.setValue(ctx, 'selected_APIKEY', '');
    await db.setValue(ctx, 'selected_franchise_domain', '');
    await db.setValue(ctx, 'selected_franchise_name', '');
    await db.setValue(ctx, 'selected_user_name', '');
    await db.users.group.set(ctx.update.message.from.id, 'main');
}

bot.command('reset', async (ctx) => {
    await resetUser(ctx);
});


bot.action('cancel', async function (ctx) {
    await clearAndOpenMainMenu(ctx);
});


bot.use(async function (ctx, next) {
    let message_text = ctx?.update?.message?.text;
    if (message_text) {
        if (message_text == '/start') {
            await db.messages.addToRemoveMessages(ctx, ctx.update.message);
            await db.messages.removeMessages(ctx);

            let user = await db.getValue(ctx, 'user');
            if (!user) await resetUser(ctx);

            await db.setValue(ctx, "next_step", "");
            await db.setValue(ctx, "callback_step", "");
            await db.setValue(ctx, "step", "index");
            await db.setValue(ctx, "last_action", "");
            let index_page = pages.find(x => x.id == 'index');
            if (!index_page) {
                console.log("\t📛", 'index page not found');
                process.exit();
            }
            ctx.update = {
                callback_query: {
                    data: 'index',
                    message: {
                        chat: {
                            id: ctx.update.message.chat.id
                        }
                    }
                }
            }
            ctx.updateType = 'callback_query';
            delete ctx.update.message;
        }
    }
    return next();
});


bot.use(async function (_ctx: Context, next) {
    let ctx = _ctx as TBFContext;
    // let ctx: TBFContext = _ctx as TBFContext;
    for (; ;) {
        ctx.CallbackPath = helpers.parseCallbackPath(ctx);

        if (ctx.updateType == 'callback_query') {
            console.log("👉", ctx.callbackQuery.data);
            if (ctx.CallbackPath) console.log("current CallbackPath:", ctx.CallbackPath.current);
            console.log(">> now will be:", await db.getValue(ctx, 'next_step'));
        }

        for (let page of pages) {
            await page.call(ctx);
        }


        console.log("middlewares tour ended");

        if (!ctx.CallbackPath) break;

        //
        let next_step = await db.getValue(ctx, 'next_step');
        if (next_step == "") { break; } else {
            if (!ctx.callbackQuery) { // подмена нынешнего сообщения под callback_query, чтобы продолжить цикл, если что-то было задано сообщением ранее
                let last_message = await db.messages.bot.getLastMessage(ctx);
                delete last_message._id;
                ctx.callbackQuery = last_message;
                ctx.updateType = 'callback_query';
            }
            ctx.callbackQuery.data = next_step;
            await db.setValue(ctx, 'next_step', "");
        }
    }
    return next();
});




bot.catch((err) => {
    console.error("Error in bot:", err, JSON.stringify(err, null, 4));
});


bot.startPolling()


// HTTP Service
let address = process.env.ADDRESS;
if (!address) {
    console.log('📛', 'Set address .env');
    process.exit();
} else {
    console.log("ℹ️ ", "Bot's web server address:", address);
}

let port = process.env.PORT;
if (!port) {
    console.log('📛', 'Set port .env');
    process.exit();
} else {
    console.log("ℹ️ ", "Bot's web server port:", port);
}

let express = require("express");
let app = express();
try {
    app.listen(port);
} catch (error) {
    console.error("💔", "Error while starting web server:", error);
}

app.use(require("./webserver")(bot));