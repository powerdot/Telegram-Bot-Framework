require('dotenv').config()

import { TBF } from "../../src";

TBF({
    webServer: {
        module: require("./webserver"),
    },
    telegram: {
        token: process.env.TWITHUB_TOKEN,
    },
    mongo: {
        dbName: "twithub_example"
    },
    config: {
        debug: true,
        pages: {
            path: './examples/twithub/pages'
        },
        webServer: {
            port: process.env.TWITHUB_PORT || 8383,
            address: process.env.TWITHUB_ADDRESS || ""
        }
    }
}).then(({ bot, db, openPage }) => {

    bot.command("start", async (ctx) => {
        console.log("start", ctx.from.id);
        await db.messages.removeMessages(ctx);
        await db.messages.user.removeSpecialCommandsExceptLastOne(ctx);
        await db.user.data.destroy(ctx);
        await openPage({ ctx, page: "index" });
    });

});
