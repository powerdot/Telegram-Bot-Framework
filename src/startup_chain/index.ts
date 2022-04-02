import { MongoDataBase, Telegraf, StartupChainInstances, TBFArgs } from "../types";
import _bot from "./bot";
import _database from "./database";
import _webserver from "./webserver";

function activate({ telegram, mongo, webServer, config }: TBFArgs): Promise<StartupChainInstances> {
    return new Promise(async resolve => {
        try {
            let instances: StartupChainInstances = {
                bot: await _bot(telegram),
                database: await _database(mongo),
                app: (webServer && webServer.module) ? await _webserver(webServer, config) : undefined
            }
            return resolve(instances);
        } catch (error) {
            console.error("💔 Error:", error);
            process.exit(1);
        }
    });
}

export default activate;