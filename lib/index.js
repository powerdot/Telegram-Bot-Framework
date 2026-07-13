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
const config_1 = require("./config");
let Create = async ({ webServer, telegram, storage, mongo, config }) => {
    const resolvedConfig = (0, config_1.resolveConfig)(config);
    const { bot, app, server, database } = await (0, startup_chain_1.default)({
        webServer,
        telegram,
        storage,
        mongo,
        config: resolvedConfig,
    });
    const db = (0, db_1.default)(bot, database, resolvedConfig);
    const { pages, plugins, stopChatActions } = (0, page_loader_1.default)({ db, config: resolvedConfig });
    const components = [...pages, ...plugins];
    bot.use((0, set_ids_1.default)());
    if (resolvedConfig.spamProtection)
        bot.use((0, spam_1.default)());
    bot.use((0, mark_user_messages_1.default)({ db }));
    bot.use((0, router_1.default)({ db, components, config: resolvedConfig }));
    if (app && webServer?.module) {
        app.use(webServer.module({ bot, db, config: resolvedConfig, components, database }));
    }
    const autoRemoveTimer = resolvedConfig.autoRemoveMessages ? (0, auto_remove_messages_1.default)({ db }) : undefined;
    let stopped = false;
    const stop = async (signal = "TBF stop") => {
        if (stopped)
            return;
        stopped = true;
        const errors = [];
        process.removeListener("SIGINT", handleSignal);
        process.removeListener("SIGTERM", handleSignal);
        if (autoRemoveTimer)
            clearInterval(autoRemoveTimer);
        try {
            bot.stop(signal);
        }
        catch (error) {
            errors.push(error);
        }
        try {
            if (server?.listening) {
                await new Promise((resolve, reject) => {
                    server.close(error => error ? reject(error) : resolve());
                });
            }
        }
        catch (error) {
            errors.push(error);
        }
        try {
            await database.client.close();
        }
        catch (error) {
            errors.push(error);
        }
        if (errors.length > 0)
            throw new AggregateError(errors, "TBF shutdown failed");
    };
    const handleSignal = (signal) => {
        void stop(signal).catch(error => console.error("💔 Error during graceful shutdown:", error));
    };
    if (resolvedConfig.gracefulShutdown.handleSignals) {
        process.once("SIGINT", handleSignal);
        process.once("SIGTERM", handleSignal);
    }
    return {
        bot,
        app,
        database,
        db,
        pages,
        plugins,
        async openPage({ ctx, page, data, action = "main", clearChat }) {
            const foundPage = components.find(component => component.id === page);
            if (!foundPage)
                throw new Error("Component not found: " + page);
            if (resolvedConfig.chatActions.stopOnNavigation)
                stopChatActions(ctx);
            await foundPage.open?.({ ctx, data, action, clearChat });
            return true;
        },
        stop,
    };
};
exports.TBF = Create;
function ComponentInit(fn) {
    return fn;
}
//# sourceMappingURL=index.js.map