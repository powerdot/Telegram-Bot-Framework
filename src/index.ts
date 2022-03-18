require('dotenv').config()
require('module-alias/register');
let config = require('../config');

import type {
    TBFContext,
    StartupChainInstances,
    DB
} from "../lib/types"
let helpers = require("../lib/helpers");
let moment = require('moment');

let clearAndOpenMainMenu = require('../lib/helpers/clearAndOpenMainMenu');

// load instances
require("../lib/startup_chain")().then(({ bot, app, database }: StartupChainInstances) => {
    let db: DB = require("../lib/helpers/db")(bot, database);
    let { pages, paginator } = require("../lib/page_loader")({ db });
    let checkSpecialFunction = require("../lib/check_special_function")({ db });
    let resetUser = require("../lib/reset_user")({ db, paginator });

    if (config.autoRemoveMessages) require("../lib/auto_remove_messages")({ db });

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

    bot.command('reset', async (ctx) => {
        await resetUser(ctx);
    });

    bot.action('cancel', async function (ctx) {
        await clearAndOpenMainMenu(ctx);
    });

    bot.use(async function (ctx: TBFContext, next) {
        let message_text = ctx?.message?.text;
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

                ctx.chat_id = ctx.update.message.chat.id;
                ctx.routeTo = 'index�main';
                ctx.updateType = 'callback_query';

                delete ctx.update.message;
            }
        }
        return next();
    });

    bot.use(async function (_ctx: TBFContext, next) {
        let ctx = _ctx;
        for (; ;) {
            ctx.CallbackPath = helpers.parseCallbackPath(ctx);
            for (let page of pages) await page.call(ctx);
            console.log("middlewares tour ended");

            if (!ctx.CallbackPath) break;
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


    app.use(require("./webserver")({ bot, db }));
});