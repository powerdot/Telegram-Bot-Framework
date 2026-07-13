import { StartupChainInstances, TBFArgs } from "../types";
import _bot from "./bot";
import _webserver from "./webserver";
import createStorage, { resolveStorageConfig } from "../storage";

function activate({ telegram, storage, mongo, webServer, config }: TBFArgs): Promise<StartupChainInstances> {
    return new Promise(async resolve => {
        try {
            let instances: StartupChainInstances = {
                bot: await _bot(telegram),
                database: await createStorage(resolveStorageConfig(storage, mongo)),
                ...((webServer && webServer.module)
                    ? await _webserver(webServer, config).then(instance => instance
                        ? { app: instance.app, server: instance.server }
                        : { app: undefined, server: undefined })
                    : { app: undefined, server: undefined })
            }
            return resolve(instances);
        } catch (error) {
            console.error("💔 Error:", error);
            process.exit(1);
        }
    });
}

export default activate;
