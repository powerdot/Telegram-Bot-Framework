import type { DB, TBFContext } from "../types"

export default ({ db }: { db: DB }) => {
    return async function (ctx: TBFContext, next: Function) {
        if (!ctx.update) return next();
        let message = "message" in ctx.update ? ctx.update.message : null;
        if (!message) return next();
        let text = "text" in message ? message.text : null;
        if (text) {
            if (["/start", "/reset"].includes(text)) {
                console.log('-4.1')
                console.log("skipping special command", text);
                await db.messages.user.addUserSpecialCommand(ctx);
                return next();
            }
        }
        await db.messages.user.addUserMessage(ctx);
        return next();
    }
}