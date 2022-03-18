require('dotenv').config()

import { MongoDataBase, Telegraf, StartupChainInstances } from "../types";

function activate(): Promise<StartupChainInstances> {
    return new Promise(async resolve => {

        let _bot = require("./bot");
        let _database = require("./database");
        let _webserver = require("./webserver");

        let instances: StartupChainInstances = {
            bot: undefined,
            database: undefined,
            app: undefined
        }

        _bot().then((bot) => {
            instances.bot = bot;
            return _database()
        }).then((database) => {
            instances.database = database;
            return _webserver()
        }).then((webserver) => {
            instances.app = webserver;
            console.log("🚀 TBF is ready!");
            resolve(instances);
        }).catch((err) => {
            console.error("💔 Error:", err);
            process.exit(1);
        })
    });
}

module.exports = activate;