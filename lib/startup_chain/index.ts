require('dotenv').config()

interface Instances {
    bot: any;
    database: any;
    app: any;
}

function activate(): Promise<Instances> {
    return new Promise(async resolve => {

        let _bot = require("./bot");
        let _db = require("./db");
        let _webserver = require("./webserver");

        let instances: Instances = {
            bot: undefined,
            database: undefined,
            app: undefined
        }

        _bot().then((bot) => {
            instances.bot = bot;
            return _db()
        }).then((db) => {
            instances.database = db;
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