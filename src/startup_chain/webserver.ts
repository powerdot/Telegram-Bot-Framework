import { Application } from "express";

export default function ({
    module,
}, config): Promise<Application> {
    // HTTP Service
    let express = require("express");
    let _address = config.webServer.address;
    if (!_address) {
        console.log('đ', 'Set web server address');
        process.exit();
    } else {
        console.log("âšī¸ ", "Bot's web server address:", _address);
    }

    let _port = config.webServer.port;
    if (!_port) {
        console.log('đ', 'Set port .env');
        process.exit();
    } else {
        console.log("âšī¸ ", "Bot's web server port:", _port);
    }

    return new Promise(async resolve => {
        if (!module) return resolve(undefined);
        let app = express();
        try {
            app.listen(_port, function () {
                console.log("âšī¸ ", "Bot's web server is running");
                resolve(app);
            })
        } catch (error) {
            console.error("đ", "Error while starting web server:", error);
        }
    })
}