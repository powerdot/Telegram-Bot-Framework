"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ db }) => {
    return async function (ctx, next) {
        if (!ctx.update)
            return next();
        let message = "message" in ctx.update ? ctx.update.message : null;
        if (!message)
            return next();
        let text = "text" in message ? message.text : null;
        if (text) {
            if (["/start", "/reset"].includes(text)) {
                await db.messages.user.addUserSpecialCommand(ctx);
                return next();
            }
        }
        await db.messages.user.addUserMessage(ctx);
        return next();
    };
};
//# sourceMappingURL=mark_user_messages.js.map