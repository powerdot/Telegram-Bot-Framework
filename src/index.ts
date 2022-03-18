require('dotenv').config()
require('module-alias/register');
let config = require('../config');

import type {
    TBFContext,
    StartupChainInstances,
    DB,
    Page,
    PaginatorReturn
} from "../lib/types"

// load instances
require("../lib/startup_chain")().then(({ bot, app, database }: StartupChainInstances) => {
    let db: DB = require("../lib/helpers/db")(bot, database);
    let { pages, paginator }: { pages: Array<Page>, paginator: PaginatorReturn } = require("../lib/page_loader")({ db });
    let resetUser = require("../lib/reset_user")({ db, paginator });

    if (config.autoRemoveMessages) require("../lib/auto_remove_messages")({ db });

    bot.use(require("../lib/bot_middlewares/mark_user_messages_to_delete")({ db }));
    bot.use(require("../lib/bot_middlewares/spam")());
    bot.use(require("../lib/bot_middlewares/mark_user_messages")({ db }));

    // Reset command
    bot.command('reset', async (ctx) => {
        await resetUser(ctx);
    });

    // Start command
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

    // Engine wheel
    bot.use(require("../lib/bot_middlewares/wheel")({ db, pages }));

    // Starting web server
    app.use(require("./webserver")({ bot, db }));
});