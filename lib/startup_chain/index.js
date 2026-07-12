"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = __importDefault(require("./bot"));
const database_1 = __importDefault(require("./database"));
const webserver_1 = __importDefault(require("./webserver"));
function activate({ telegram, mongo, webServer, config }) {
    return new Promise(async (resolve) => {
        try {
            let instances = {
                bot: await (0, bot_1.default)(telegram),
                database: await (0, database_1.default)(mongo || {
                    url: "mongodb://localhost:27017",
                    dbName: "tbf_default"
                }),
                app: (webServer && webServer.module) ? await (0, webserver_1.default)(webServer, config) : undefined
            };
            return resolve(instances);
        }
        catch (error) {
            console.error("💔 Error:", error);
            process.exit(1);
        }
    });
}
exports.default = activate;
//# sourceMappingURL=index.js.map