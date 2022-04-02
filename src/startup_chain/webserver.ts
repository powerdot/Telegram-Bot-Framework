export default function ({
    module,
}, config) {
    // HTTP Service
    let express = require("express");
    let _address = config.webServer.address;
    if (!_address) {
        console.log('📛', 'Set web server address');
        process.exit();
    } else {
        console.log("ℹ️ ", "Bot's web server address:", _address);
    }

    let _port = config.webServer.port;
    if (!_port) {
        console.log('📛', 'Set port .env');
        process.exit();
    } else {
        console.log("ℹ️ ", "Bot's web server port:", _port);
    }

    return new Promise(async resolve => {
        if (!module) return resolve(undefined);
        let app = express();
        try {
            app.listen(_port, function () {
                console.log("ℹ️ ", "Bot's web server is running");
                resolve(app);
            })
        } catch (error) {
            console.error("💔", "Error while starting web server:", error);
        }
    })
}