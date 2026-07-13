import type { TBFConfig } from "./types";
type ResolvedTBFConfig = {
    pages: {
        path: string;
    };
    plugins: {
        path: string;
    };
    autoRemoveMessages: boolean;
    clearChatOnPageOpen: boolean;
    spamProtection: boolean;
    debug: boolean;
    gracefulShutdown: {
        handleSignals: boolean;
    };
    webServer: {
        port: number;
        address: string;
    };
};
declare function resolveConfig(config?: TBFConfig, cwd?: string): ResolvedTBFConfig;
export { resolveConfig };
export type { ResolvedTBFConfig };
