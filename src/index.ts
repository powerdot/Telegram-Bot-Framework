import type {
    StartupChainInstances,
    DB,
    Component,
    TBFPromiseReturn,
    TBFArgs,
    WebServerArgs,
} from "./types"

let Create = ({ webServer, telegram, mongo, config }: TBFArgs) => {

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
        require("../src/startup_chain")({ webServer, telegram, mongo, config: _config } as TBFArgs).then(async ({ bot, app, database }: StartupChainInstances) => {
            let db: DB = require("../src/helpers/db")(bot, database);
            let { pages, plugins }: { pages: Component[], plugins: Component[] } = require("../src/page_loader")({ db, config: _config });
            let components = [...pages, ...plugins];

            bot.use(require("../src/bot_middlewares/set_ids")());

            bot.use(require("../src/bot_middlewares/spam")());
            bot.use(require("../src/bot_middlewares/mark_user_messages")({ db }));

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

            if (config.autoRemoveMessages) require("../src/auto_remove_messages")({ db });

            // Engine router
            bot.use(require("../src/bot_middlewares/router")({ db, components }));

            // Starting web server
            if (app && webServer?.module)
                app.use(webServer.module({ bot, db, config, components, database } as WebServerArgs));
        });
    });
};

export default Create