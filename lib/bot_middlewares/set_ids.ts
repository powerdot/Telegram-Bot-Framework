import type { TBFContext } from "../types"

function getChatId(ctx: TBFContext) {
    let chat_data = ctx?.update?.message || ctx?.callbackQuery?.message || ctx?.update?.callback_query?.message;
    return chat_data.chat.id
}

module.exports = () => {
    return async function (ctx: TBFContext, next) {
        ctx.chatId = getChatId(ctx);
        return next();
    }
}