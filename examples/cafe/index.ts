require('dotenv').config()

import { TBF } from "../../src";

TBF({
    telegram: {
        token: process.env.CAFE_TOKEN,
    },
    mongo: {
        dbName: 'test_cafe_database'
    },
    config: {
        debug: true,
        pages: {
            path: './examples/cafe/pages'
        },
        plugins: {
            path: './examples/cafe/plugins'
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
