require('dotenv').config()

import type {
    TBF as TelegramBotFramework,
} from "../lib/types"

const TBF: TelegramBotFramework = require("../lib");

TBF.create({
    webServer: {
        module: require("./webserver"),
        port: process.env.PORT || 8383,
        address: process.env.ADDRESS || ""
    },
    telegram: {
        token: process.env.TOKEN,
    },
    mongo: {
        url: process.env.MONGO_URL,
        dbName: process.env.MONGO_DB
    },
    config: {
        pages: {
            path: "./pages",
        },
        autoRemoveMessages: true,
        debug: true
    }
}).then(({ bot, db, openPage }) => {
    bot.command("start", async (ctx) => {
        console.log("start", ctx.from.id);
        await db.messages.removeMessages(ctx);
        await db.messages.user.removeSpecialCommandsExceptLastOne(ctx);
        await db.user.data.destroy(ctx);
        await openPage({ ctx, pageId: "index" });
    });
    bot.command("reset", async (ctx) => {
        console.log("reset", ctx.from.id);
        await db.messages.removeMessages(ctx);
        await db.messages.user.removeSpecialCommandsExceptLastOne(ctx);
        await db.user.destroy(ctx);
        await openPage({ ctx, pageId: "index" });
    });
})



