"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = resolveConfig;
const node_path_1 = require("node:path");
function resolveConfig(config = {}, cwd = process.cwd()) {
    return {
        pages: {
            path: config.pages?.path ?? (0, node_path_1.resolve)(cwd, "./pages"),
        },
        plugins: {
            path: config.plugins?.path ?? (0, node_path_1.resolve)(cwd, "./plugins"),
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
//# sourceMappingURL=config.js.map