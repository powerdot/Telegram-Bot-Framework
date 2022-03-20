import type { DB, TBFContext } from "../types"

module.exports = ({ db }: { db: DB }) => {
    return async function (ctx: TBFContext, next) {
        if (!ctx.update) return next();
        if (!ctx.update.message) return next();
        await db.messages.user.addUserMessage(ctx);
        console.log("addUserMessage", ctx.update.message);
        return next();
    }
}