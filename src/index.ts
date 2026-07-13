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
import { resolveConfig } from "./config";
import { stopBot } from "./helpers/stop_bot";

let Create = async ({ webServer, telegram, storage, mongo, config }: TBFArgs): Promise<TBFPromiseReturn> => {
    const resolvedConfig = resolveConfig(config);
    const { bot, app, server, database }: StartupChainInstances = await StartupChain({
        webServer,
        telegram,
        storage,
        mongo,
        config: resolvedConfig,
    } as TBFArgs);
    const db: DB = DBInstance(bot, database, resolvedConfig);
    const { pages, plugins, stopChatActions } = PageLoader({ db, config: resolvedConfig });
    const components = [...pages, ...plugins];

    bot.use(Middleware_SetIds());
    if (resolvedConfig.spamProtection) bot.use(Middleware_Spam());
    bot.use(Middleware_MarkUserMessages({ db }));
    bot.use(Middleware_Router({ db, components, config: resolvedConfig }));

    if (app && webServer?.module) {
        app.use(webServer.module({ bot, db, config: resolvedConfig, components, database } as WebServerArgs));
    }

    const autoRemoveTimer = resolvedConfig.autoRemoveMessages ? AutoRemoveMessages({ db }) : undefined;
    let stopped = false;

    const stop = async (signal = "TBF stop") => {
        if (stopped) return;
        stopped = true;
        const errors: unknown[] = [];
        process.removeListener("SIGINT", handleSignal);
        process.removeListener("SIGTERM", handleSignal);
        if (autoRemoveTimer) clearInterval(autoRemoveTimer);
        try {
            stopBot(bot, signal);
        } catch (error) {
            errors.push(error);
        }
        try {
            if (server?.listening) {
                await new Promise<void>((resolve, reject) => {
                    server.close(error => error ? reject(error) : resolve());
                });
            }
        } catch (error) {
            errors.push(error);
        }
        try {
            await database.client.close();
        } catch (error) {
            errors.push(error);
        }
        if (errors.length > 0) throw new AggregateError(errors, "TBF shutdown failed");
    };

    const handleSignal = (signal: NodeJS.Signals) => {
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
            if (!foundPage) throw new Error("Component not found: " + page);
            if (resolvedConfig.chatActions.stopOnNavigation) stopChatActions(ctx);
            await foundPage.open?.({ ctx, data, action, clearChat });
            return true;
        },
        stop,
    };
};

function ComponentInit(fn: ComponentExport) {
    return fn;
}

export {
    Create as TBF,
    ComponentInit as Component
};

export type { StorageConfig, StorageDatabase } from "./storage";
