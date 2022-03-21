require('dotenv').config()
require('module-alias/register');
let config = require('../config');

import type {
    StartupChainInstances,
    DB,
    Page,
    TBFPromiseReturn,
    TBFContext,
    WebServerArgs
} from "./types"

module.exports.create = ({ webServer, telegramToken }) => {
    return new Promise(async (resolve, reject) => {
        require("../lib/startup_chain")().then(async ({ bot, app, database }: StartupChainInstances) => {
            let db: DB = require("../lib/helpers/db")(bot, database);
            let { pages }: { pages: Array<Page> } = require("../lib/page_loader")({ db });

            bot.use(require("../lib/bot_middlewares/set_ids")());

            bot.use(require("../lib/bot_middlewares/mark_user_messages_to_delete")({ db }));
            bot.use(require("../lib/bot_middlewares/spam")());
            bot.use(require("../lib/bot_middlewares/mark_user_messages")({ db }));

            let return_data: TBFPromiseReturn = {
                bot,
                app,
                database,
                db,
                pages,
                openPage: ({ ctx, pageId }) => {
                    return new Promise(async (resolve, reject) => {
                        let found_page = pages.find(page => page.id === pageId);
                        if (!found_page) return reject(new Error("Page not found: " + pageId));
                        found_page.open(ctx);
                        return resolve(true);
                    });
                }
            }
            await resolve(return_data);

            if (config.autoRemoveMessages) require("../lib/auto_remove_messages")({ db });

            // Engine wheel
            bot.use(require("../lib/bot_middlewares/wheel")({ db, pages }));

            // Starting web server
            if (!webServer) app.use(webServer({ bot, db, config, pages, database } as WebServerArgs));
        });
    });
}
