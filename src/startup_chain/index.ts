import { MongoDataBase, Telegraf, StartupChainInstances, TBFArgs } from "../types";

function activate({ telegram, mongo, webServer, config }: TBFArgs): Promise<StartupChainInstances> {
    return new Promise(async resolve => {
        let _bot = require("./bot");
        let _database = require("./database");
        let _webserver = require("./webserver");

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

module.exports = activate;