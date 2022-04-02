import type {
    StartupChainInstances,
    DB,
    Component,
    TBFPromiseReturn,
    TBFArgs,
    WebServerArgs,
    TBF,
} from "./types";
import StartupChain from "./startup_chain";
import DBInstance from "./helpers/db";
import PageLoader from "./page_loader";

import Middleware_SetIds from "./bot_middlewares/set_ids";
import Middleware_Spam from "./bot_middlewares/spam";
import Middleware_MarkUserMessages from "./bot_middlewares/mark_user_messages";
import Middleware_Router from "./bot_middlewares/router";

import AutoRemoveMessages from "./auto_remove_messages";

let Create = ({ webServer, telegram, mongo, config }: TBFArgs): Promise<TBFPromiseReturn> => {

    let default_config = {
        pages: {
            path: "./pages",
        },
        plugins: {
            path: "./plugins",
        },
        autoRemoveMessages: true,
        debug: false,
        webServer: {
            port: 8080,
            address: "",
        }
    }

    let _config = Object.assign(default_config, config);

    if (_config.webServer?.address) _config.webServer.address = _config.webServer.address.replace('//localhost', '//127.0.0.1');

    return new Promise(async (resolve, reject) => {
        StartupChain({ webServer, telegram, mongo, config: _config } as TBFArgs).then(async ({ bot, app, database }: StartupChainInstances) => {
            let db: DB = DBInstance(bot, database);
            let { pages, plugins }: { pages: Component[], plugins: Component[] } = PageLoader({ db, config: _config });
            let components = [...pages, ...plugins];

            bot.use(Middleware_SetIds());
            bot.use(Middleware_Spam());
            bot.use(Middleware_MarkUserMessages({ db }));

            let return_data: TBFPromiseReturn = {
                bot,
                app,
                database,
                db,
                pages,
                plugins,
                openPage: ({ ctx, pageId }) => {
                    return new Promise(async (resolve, reject) => {
                        let found_page = components.find(page => page.id === pageId);
                        if (!found_page) return reject(new Error("Component not found: " + pageId));
                        found_page.open(ctx);
                        return resolve(true);
                    });
                }
            }
            await resolve(return_data);

            if (config.autoRemoveMessages) AutoRemoveMessages({ db });

            // Engine router
            bot.use(Middleware_Router({ db, components }));

            // Starting web server
            if (app && webServer?.module)
                app.use(webServer.module({ bot, db, config, components, database } as WebServerArgs));
        });
    });
};

export default Create