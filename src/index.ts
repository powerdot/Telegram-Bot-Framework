import type {
    TBF as TelegramBotFramework,
} from "../lib/types"

const TBF: TelegramBotFramework = require("../lib");

TBF.create({
    webServer: require("./webserver"),
}).then(({ bot, db, pages, app, database }) => {
    bot.command("start", async (ctx) => {
        console.log("start", ctx.from.id);
        await db.user.data.destroy(ctx.from.id);
        let index_page = pages.find(page => page.id === "index");
        await index_page.open(ctx);
    });
})



