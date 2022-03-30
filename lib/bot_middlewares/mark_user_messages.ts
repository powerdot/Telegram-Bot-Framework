import type { DB, TBFContext } from "../types"

module.exports = ({ db }: { db: DB }) => {
    return async function (ctx: TBFContext, next) {
        if (!ctx.update) return next();
        console.log('-1')
        let message = "message" in ctx.update ? ctx.update.message : null;
        console.log('-2')
        if (!message) return next();
        console.log('-3')
        let text = "text" in message ? message.text : null;
        console.log('-4')
        if (["/start", "/reset"].includes(text)) {
            console.log('-4.1')
            console.log("skipping special command", text);
            await db.messages.user.addUserSpecialCommand(ctx);
            return next();
        }
        console.log('-5')
        await db.messages.user.addUserMessage(ctx);
        return next();
    }
}