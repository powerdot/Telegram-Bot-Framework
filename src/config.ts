import { resolve } from "node:path";

import type { TBFConfig } from "./types";

type ResolvedTBFConfig = {
    pages: { path: string };
    plugins: { path: string };
    autoRemoveMessages: boolean;
    clearChatOnPageOpen: boolean;
    spamProtection: boolean;
    debug: boolean;
    gracefulShutdown: {
        handleSignals: boolean;
    };
    chatActions: {
        stopOnNavigation: boolean;
    };
    webServer: {
        port: number;
        address: string;
    };
};

function resolveConfig(config: TBFConfig = {}, cwd = process.cwd()): ResolvedTBFConfig {
    return {
        pages: {
            path: config.pages?.path ?? resolve(cwd, "./pages"),
        },
        plugins: {
            path: config.plugins?.path ?? resolve(cwd, "./plugins"),
        },
        autoRemoveMessages: config.autoRemoveMessages ?? true,
        clearChatOnPageOpen: config.clearChatOnPageOpen ?? true,
        spamProtection: config.spamProtection ?? true,
        debug: config.debug ?? false,
        gracefulShutdown: {
            handleSignals: config.gracefulShutdown?.handleSignals ?? false,
        },
        chatActions: {
            stopOnNavigation: config.chatActions?.stopOnNavigation ?? false,
        },
        webServer: {
            port: config.webServer?.port ?? 8080,
            address: (config.webServer?.address ?? "").replace("//localhost", "//127.0.0.1"),
        },
    };
}

export { resolveConfig };
export type { ResolvedTBFConfig };
