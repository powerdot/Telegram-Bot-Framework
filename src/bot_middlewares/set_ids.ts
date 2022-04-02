import type { TBFContext } from "../types"

function getChatId(ctx: TBFContext) {
    return ctx?.chat?.id;
    // let update_message_data = "message" in ctx.update ? ctx.update.message : ctx.update;
    // let callbackQuery_data = "callback_query" in ctx.update ? ctx.update.callback_query.message : null;
    // let chat_data = update_message_data || ctx?.callbackQuery?.message || callbackQuery_data;
    // return "chat" in chat_data ? chat_data.chat.id : undefined;
}

module.exports = () => {
    return async function (ctx: TBFContext, next: Function) {
        ctx.chatId = getChatId(ctx);
        return next();
    }
}