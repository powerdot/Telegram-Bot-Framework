import type {
    StartupChainInstances,
    DB,
    Component,
    ComponentExport,
    TBFPromiseReturn,
    TBFArgs,
    WebServerArgs,
} from "./types";
import StartupChain from "./startup_chain";
import DBInstance from "./helpers/db";
import PageLoader from "./page_loader";

import Middleware_SetIds from "./bot_middlewares/set_ids";
import Middleware_Spam from "./bot_middlewares/spam";
import Middleware_MarkUserMessages from "./bot_middlewares/mark_user_messages";
import Middleware_Router from "./bot_middlewares/router";

import AutoRemoveMessages from "./auto_remove_messages";

let path = require("path");

let Create = ({ webServer, telegram, mongo, config }: TBFArgs): Promise<TBFPromiseReturn> => {

    let cwd = process.cwd();
    let default_config = {
        pages: {
            path: path.resolve(cwd, "./pages"),
        },
        plugins: {
            path: path.resolve(cwd, "./plugins"),
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
            let db: DB = DBInstance(bot, database, _config);
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
                openPage: ({ ctx, page, data, action }) => {
                    return new Promise(async (resolve, reject) => {
                        let found_page = components.find(p => p.id === page);
                        if (!found_page) return reject(new Error("Component not found: " + page));
                        found_page.open({ ctx, data, action });
                        return resolve(true);
                    });
                }
            }
            await resolve(return_data);

            if (_config.autoRemoveMessages) AutoRemoveMessages({ db });

            // Engine router
            bot.use(Middleware_Router({ db, components, config: _config }));

            // Starting web server
            if (app && webServer?.module)
                app.use(webServer.module({ bot, db, config: _config, components, database } as WebServerArgs));
        });
    });
};

function ComponentInit(fn: ComponentExport) {
    return fn;
}

export {
    Create as TBF,
    ComponentInit as Component
};