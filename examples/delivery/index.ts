require('dotenv').config()

import { TBF } from "../../src";

TBF({
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
        await openPage({ ctx, page: "index" });
    });

});
