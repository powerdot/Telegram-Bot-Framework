"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1({ token, apiUrl }) {
    return new Promise(async (resolve) => {
        const { Telegraf } = require('telegraf');
        let _token = token;
        if (!_token) {
            console.error('📛', 'Set token');
            process.exit();
        }
        else {
            console.log("ℹ️ ", "Telegram token is set.");
        }
        let bot;
        if (apiUrl) {
            bot = new Telegraf(_token, {
                telegram: {
                    apiRoot: apiUrl
                }
            });
            console.log("ℹ️ ", "ApiUrl installed", apiUrl);
        }
        else {
            bot = new Telegraf(_token);
            console.log("ℹ️ ", "Bot without proxy and apiUrl");
        }
        bot.catch((err) => {
            console.error("🚫 ", "Telegram bot error:", err);
        });
        bot.launch().then(() => {
            console.log("ℹ️ ", "Telegram bot launched");
            resolve(bot);
            return;
        });
    });
}
//# sourceMappingURL=bot.js.map