require('dotenv').config()

import type {
    TBF as TelegramBotFramework,
} from "../../lib/types"

const TBF: TelegramBotFramework = require("../../lib");

TBF.create({
    telegram: {
        token: process.env.DELIVERY_TOKEN,
    },
    mongo: {
        url: process.env.MONGO_URL,
        dbName: 'delivery_example'
    },
    config: {
        debug: true,
        pages: {
            path: './examples/delivery/pages',
        },
        plugins: {
            path: './examples/delivery/plugins',
        }
    }
}).then(({ bot, db, openPage }) => {

    bot.command("start", async (ctx) => {
        console.log("start", ctx.from.id);
        await db.messages.removeMessages(ctx);
        await db.messages.user.removeSpecialCommandsExceptLastOne(ctx);
        // await db.user.data.destroy(ctx);
        await openPage({ ctx, pageId: "index" });
    });

});
