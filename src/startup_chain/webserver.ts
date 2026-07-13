import { Application } from "express";
import { Server } from "node:http";
import { TBFArgs, TBFConfig, WebServerArgs } from "../types";

export default function ({
    module,
}: {
    module: (args: WebServerArgs) => {}
},
    config: TBFConfig | undefined
): Promise<{ app: Application, server: Server } | undefined> | undefined {
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
    } else {
        console.log("ℹ️ ", "Bot's web server address:", _address);
    }

    let _port = config?.webServer?.port;
    if (!_port) {
        console.log('📛', 'Set port .env');
        process.exit();
    } else {
        console.log("ℹ️ ", "Bot's web server port:", _port);
    }

    return new Promise((resolve, reject) => {
        if (!module) return resolve(undefined);
        let app = express();
        const server = app.listen(_port, function () {
            console.log("ℹ️ ", "Bot's web server is running");
            resolve({ app, server });
        });
        server.once("error", reject);
    })
}
