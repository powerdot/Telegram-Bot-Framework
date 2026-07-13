import { Telegraf } from "telegraf";
import { TBFContext } from "../types";

type LaunchableBot = {
    launch(config: object, onLaunch: () => void): Promise<void>;
};

function waitForBotLaunch(bot: LaunchableBot): Promise<void> {
    return new Promise((resolve, reject) => {
        let launched = false;
        const polling = bot.launch({}, () => {
            launched = true;
            resolve();
        });
        polling.catch(error => {
            if (!launched) reject(error);
            else console.error("🚫 ", "Telegram polling error:", error);
        });
    });
}

export default function ({
    token,
    apiUrl
}: { token: string, apiUrl?: string }): Promise<Telegraf<TBFContext>> {
    return new Promise(async (resolve, reject) => {
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

        waitForBotLaunch(bot).then(() => {
            console.log("ℹ️ ", "Telegram bot launched");
            resolve(bot);
        }).catch(reject);
    })
}

export { waitForBotLaunch };
