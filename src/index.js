require('dotenv').config()
require('module-alias/register');
const Telegraf = require('telegraf');
let helpers = require("../lib/helpers");
let keyboard_builder = require("../lib/helpers/keyboard_builder");
let moment = require("moment");
let db = require("../lib/helpers/db");
let paginator = require("../lib/paginator");
let clearAndOpenMainMenu = require('../lib/helpers/clearAndOpenMainMenu');

// Telegram Bot Service
require("../lib/removeCheck")();


function parseKeyboard(keyboard = []) {
    let inline_keyboard = [];
    for (let row of keyboard) {
        if (!row) continue;
        let new_row = [];
        for (let button of row) {
            let callback_data = "";
            if (button.action) {
                if (typeof button.action == "function") {
                    callback_data = button.action();
                } else {
                    callback_data = this.routeToAction(button.action, button.data);
                }
            }
            if (button.page) callback_data = button.page;
            new_row.push({
                text: button.text,
                callback_data
            });
        }
        inline_keyboard.push(new_row);
    }
    return inline_keyboard;
}

let _pages = paginator.list();
let pages = [];
for (let page of _pages) {
    let pageObject = page({
        db,
        config: require('../config'),
        paginator,
        routeToPage: (page_id) => page_id,
    });
    let binding = {
        routeToAction(action = 'main', data) {
            return `${pageObject.id}-${action}${data ? ('-' + data) : ''}`;
        },
        id: pageObject.id,
        async send({ ctx, text = "", keyboard = [] }) {
            if (!text) throw new Error("send() text is empty");
            if (keyboard.length > 0) {
                let inline_keyboard = parseKeyboard.bind(this)(keyboard);
                return await ctx.replyWithMarkdown(text, { reply_markup: { inline_keyboard } });
            } else {
                return await ctx.replyWithMarkdown(text);
            }
        },
        async update({ ctx, text = "", keyboard = [] }) {
            if (!text) throw new Error("update() text is empty");
            if (keyboard.length > 0) {
                let inline_keyboard = parseKeyboard.bind(this)(keyboard);
                return await ctx.editMessageText(text, { reply_markup: { inline_keyboard } });
            } else {
                return await ctx.editMessageText(text);
            }
        },
        async goToAction(ctx, action) {
            await db.setValue(ctx, 'next_step', this.routeToAction(action))
        },
        async goToPage(ctx, page) {
            await db.setValue(ctx, 'next_step', page)
        },
        async clearChat(ctx) {
            await db.messages.removeMessages(ctx);
        }
    }
    if (pageObject?.actions?.main) {
        let main_action = pageObject.actions.main;
        let main_fn = typeof main_action == "function" ? main_action : main_action.handler;
        main_fn.bind(binding);
    }
    if (!pageObject.onCallbackQuery) {
        pageObject.onCallbackQuery = async (ctx) => {
            pageObject.ctx = ctx;
            let callbackData = ctx.CallbackPath.current;
            if (callbackData.route != pageObject.id) return false;
            let perms = await paginator.check_requirements(ctx, pageObject.requirements, pageObject.id);
            if (!perms) return;
            try {
                if (!callbackData.action) callbackData.action = "main";
                let action = pageObject.actions[callbackData.action];
                if (action) {
                    if (action.clearChat) await db.messages.removeMessages(ctx);
                    let action_fn = typeof action == "function" ? action : action.handler;
                    await action_fn.bind(binding)(ctx)
                    await db.setValue(ctx, "step", pageObject.id + "-" + callbackData.action);
                } else {
                    throw ("action route not found: " + callbackData.action);
                }
            } catch (error) {
                console.error(`onCallbackQuery ERROR ON PAGE "${pageObject.id}":`, error);
            }
        }
    }
    if (!pageObject.onMessage) {
        pageObject.onMessage = async (ctx) => {
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
                    let text_handler_fn = typeof text_handler == "function" ? text_handler : text_handler.handler;
                    await text_handler_fn.bind(binding)(ctx);
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
let bot;
if (process.env.PROXY) {
    bot = new Telegraf.Telegraf(token, {
        telegram: {
            apiRoot: process.env.PROXY
        }
    });
    console.log("ℹ️ ", "Proxy installed", process.env.PROXY);
} else {
    bot = new Telegraf.Telegraf(token);
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
                return async function () {
                    let args = arguments;
                    let a = await checkSpecialFunction(o, c, args);
                    return a;
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


bot.use(async function (ctx, next) {
    for (; ;) {
        ctx.CallbackPath = helpers.parseCallbackPath(ctx);

        if (ctx.updateType == 'callback_query') {
            console.log("👉", ctx.update.callback_query.data);
            console.log("current CallbackPath:", ctx.CallbackPath.current);
            console.log(">> now will be:", await db.getValue(ctx, 'next_step'));
        }

        for (let page of pages) {
            await page.call(ctx);
        }
        console.log("middlewares tour ended");

        //
        let next_step = await db.getValue(ctx, 'next_step');
        if (next_step == "") { break; } else {
            if (!ctx.update.callback_query) { // подмена нынешнего сообщения под callback_query, чтобы продолжить цикл, если что-то было задано сообщением ранее
                let last_message = await db.messages.bot.getLastMessage(ctx);
                delete last_message._id;
                ctx.update.callback_query = last_message;
                ctx.updateType = 'callback_query';
            }
            ctx.update.callback_query.data = next_step;
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