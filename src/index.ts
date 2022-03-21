import type {
    TBF as TelegramBotFramework,
} from "../lib/types"

const TBF: TelegramBotFramework = require("../lib");

TBF.create({
    webServer: require("./webserver"),
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



