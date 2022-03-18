import type { DB, TBFContext, Page } from "../types"

let helpers = require("../helpers");

module.exports = ({ db, pages }: { db: DB, pages: Page[] }) => {
    return async function (_ctx: TBFContext, next) {
        let ctx = _ctx;
        for (; ;) {
            ctx.CallbackPath = helpers.parseCallbackPath(ctx);
            for (let page of pages) await page.call(ctx);
            console.log("middlewares tour ended");

            if (!ctx.CallbackPath) break;
            let next_step = await db.getValue(ctx, 'next_step');
            if (next_step == "") { break; } else {
                if (!ctx.callbackQuery) {
                    let last_message = await db.messages.bot.getLastMessage(ctx);
                    delete last_message._id;
                    ctx.callbackQuery = last_message;
                    ctx.updateType = 'callback_query';
                }
                ctx.callbackQuery.data = next_step;
                await db.setValue(ctx, 'next_step', "");
            }
        }
        return next();
    }
}