require('module-alias/register');

import type {
    StartupChainInstances,
    DB,
    Page,
    TBFPromiseReturn,
    TBFArgs,
    WebServerArgs,
} from "./types"

module.exports.create = ({ webServer, telegram, mongo, config }: TBFArgs) => {

    let default_config = {
        pages: {
            path: "./pages",
        },
        autoRemoveMessages: true,
        debug: false
    }

    let _config = Object.assign(default_config, config);

    return new Promise(async (resolve, reject) => {
        require("../lib/startup_chain")({ webServer, telegram, mongo } as TBFArgs).then(async ({ bot, app, database }: StartupChainInstances) => {
            let db: DB = require("../lib/helpers/db")(bot, database);
            let { pages }: { pages: Array<Page> } = require("../lib/page_loader")({ db, config: _config });

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

            // Engine router
            bot.use(require("../lib/bot_middlewares/router")({ db, pages }));

            // Starting web server
            if (app && webServer?.module)
                app.use(webServer.module({ bot, db, config, pages, database } as WebServerArgs));
        });
    });
}
