"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TBF = void 0;
exports.Component = ComponentInit;
const startup_chain_1 = __importDefault(require("./startup_chain"));
const db_1 = __importDefault(require("./helpers/db"));
const page_loader_1 = __importDefault(require("./page_loader"));
const set_ids_1 = __importDefault(require("./bot_middlewares/set_ids"));
const spam_1 = __importDefault(require("./bot_middlewares/spam"));
const mark_user_messages_1 = __importDefault(require("./bot_middlewares/mark_user_messages"));
const router_1 = __importDefault(require("./bot_middlewares/router"));
const auto_remove_messages_1 = __importDefault(require("./auto_remove_messages"));
let path = require("path");
let Create = ({ webServer, telegram, mongo, config }) => {
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
    };
    let _config = Object.assign(default_config, config);
    if (_config.webServer?.address)
        _config.webServer.address = _config.webServer.address.replace('//localhost', '//127.0.0.1');
    return new Promise(async (resolve, reject) => {
        (0, startup_chain_1.default)({ webServer, telegram, mongo, config: _config }).then(async ({ bot, app, database }) => {
            let db = (0, db_1.default)(bot, database, _config);
            let { pages, plugins } = (0, page_loader_1.default)({ db, config: _config });
            let components = [...pages, ...plugins];
            bot.use((0, set_ids_1.default)());
            bot.use((0, spam_1.default)());
            bot.use((0, mark_user_messages_1.default)({ db }));
            let return_data = {
                bot,
                app,
                database,
                db,
                pages,
                plugins,
                openPage: ({ ctx, page, data, action = "main" }) => {
                    return new Promise(async (resolve, reject) => {
                        let found_page = components.find(p => p.id === page);
                        if (!found_page)
                            return reject(new Error("Component not found: " + page));
                        if (found_page.open)
                            found_page.open({ ctx, data, action });
                        return resolve(true);
                    });
                }
            };
            await resolve(return_data);
            if (_config.autoRemoveMessages)
                (0, auto_remove_messages_1.default)({ db });
            // Engine router
            bot.use((0, router_1.default)({ db, components, config: _config }));
            // Starting web server
            if (app && webServer?.module)
                app.use(webServer.module({ bot, db, config: _config, components, database }));
        });
    });
};
exports.TBF = Create;
function ComponentInit(fn) {
    return fn;
}
//# sourceMappingURL=index.js.map