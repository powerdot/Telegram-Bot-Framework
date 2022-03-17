module.exports = function () {
    // HTTP Service
    let express = require("express");
    let address = process.env.ADDRESS;
    if (!address) {
        console.log('📛', 'Set address .env');
        process.exit();
    } else {
        console.log("ℹ️ ", "Bot's web server address:", address);
    }

    let port = process.env.PORT;
    if (!port) {
        console.log('📛', 'Set port .env');
        process.exit();
    } else {
        console.log("ℹ️ ", "Bot's web server port:", port);
    }

    return new Promise(async resolve => {
        let app = express();
        try {
            app.listen(port, function () {
                console.log("ℹ️ ", "Bot's web server is running");
                resolve(app);
            })
        } catch (error) {
            console.error("💔", "Error while starting web server:", error);
        }
    })
}