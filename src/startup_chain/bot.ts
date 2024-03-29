import { Telegraf } from "telegraf";
import { TBFContext } from "../types";

export default function ({
    token,
    apiUrl
}: { token: string, apiUrl?: string }): Promise<Telegraf<TBFContext>> {
    return new Promise(async resolve => {
        const { Telegraf } = require('telegraf')

        let _token = token;
        if (!_token) {
            console.error('📛', 'Set token');
            process.exit();
        } else {
            console.log("ℹ️ ", "Telegram token is set.");
        }

        let bot: any;
        if (apiUrl) {
            bot = new Telegraf(_token, {
                telegram: {
                    apiRoot: apiUrl
                }
            })
            console.log("ℹ️ ", "ApiUrl installed", apiUrl);
        } else {
            bot = new Telegraf(_token);
            console.log("ℹ️ ", "Bot without proxy and apiUrl");
        }

        bot.catch((err: any) => {
            console.error("🚫 ", "Telegram bot error:", err);
        });

        bot.launch().then(() => {
            console.log("ℹ️ ", "Telegram bot launched");
            resolve(bot);
            return;
        })
    })
}