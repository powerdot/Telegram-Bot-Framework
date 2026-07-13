"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getChatId(ctx) {
    return ctx?.chat?.id;
    // let update_message_data = "message" in ctx.update ? ctx.update.message : ctx.update;
    // let callbackQuery_data = "callback_query" in ctx.update ? ctx.update.callback_query.message : null;
    // let chat_data = update_message_data || ctx?.callbackQuery?.message || callbackQuery_data;
    // return "chat" in chat_data ? chat_data.chat.id : undefined;
}
function getSenderChatId(ctx) {
    if (ctx.message && "sender_chat" in ctx.message)
        return ctx.message.sender_chat?.id;
    if (ctx.callbackQuery?.message && "sender_chat" in ctx.callbackQuery.message) {
        return ctx.callbackQuery.message.sender_chat?.id;
    }
    return undefined;
}
exports.default = () => {
    return async function (ctx, next) {
        ctx.chatId = getChatId(ctx);
        ctx.fromId = ctx.from?.id;
        ctx.senderChatId = getSenderChatId(ctx);
        return next();
    };
};
//# sourceMappingURL=set_ids.js.map