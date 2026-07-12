"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let spam_store = {};
exports.default = () => {
    return async function (ctx, next) {
        if (!ctx.update)
            return next();
        let message = "message" in ctx.update ? ctx.update.message : null;
        if (!message)
            return next();
        let user_id = message.from.id;
        const now = Math.floor(Date.now() / 1000);
        if (!spam_store[user_id])
            spam_store[user_id] = now - 10;
        if (spam_store[user_id] == now) {
            console.warn('📛 SPAM:', user_id, 'is sending messages too fast');
            return false;
        }
        spam_store[user_id] = now;
        return next();
    };
};
//# sourceMappingURL=spam.js.map