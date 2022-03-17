module.exports = function () {
    return new Promise(async resolve => {
        const Telegraf = require('telegraf');

        let token = process.env.TOKEN;
        if (!token) {
            console.log('📛', 'Set token .env');
            process.exit();
        } else {
            console.log("ℹ️ ", "Telegram token is set.");
        }

        let bot;
        if (process.env.PROXY) {
            bot = new Telegraf(token, {
                telegram: {
                    apiRoot: process.env.PROXY
                }
            });
            console.log("ℹ️ ", "Proxy installed", process.env.PROXY);
        } else {
            bot = new Telegraf(token);
            console.log("ℹ️ ", "Bot without proxy");
        }

        bot.catch((err) => {
            console.error("🚫 ", "Telegram bot error:", err);
        });
        bot.launch().then(() => {
            console.log("ℹ️ ", "Telegram bot launched");
            bot.startPolling()
            resolve(bot);
        })
    })
}