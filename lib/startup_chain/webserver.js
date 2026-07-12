"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1({ module, }, config) {
    if (!config) {
        console.log('📛', 'Set config');
        return process.exit();
    }
    // HTTP Service
    let express = require("express");
    let _address = config?.webServer?.address;
    if (!_address) {
        console.log('📛', 'Set web server address');
        process.exit();
    }
    else {
        console.log("ℹ️ ", "Bot's web server address:", _address);
    }
    let _port = config?.webServer?.port;
    if (!_port) {
        console.log('📛', 'Set port .env');
        process.exit();
    }
    else {
        console.log("ℹ️ ", "Bot's web server port:", _port);
    }
    return new Promise(async (resolve) => {
        if (!module)
            return resolve(undefined);
        let app = express();
        try {
            app.listen(_port, function () {
                console.log("ℹ️ ", "Bot's web server is running");
                resolve(app);
            });
        }
        catch (error) {
            console.error("💔", "Error while starting web server:", error);
        }
    });
}
//# sourceMappingURL=webserver.js.map