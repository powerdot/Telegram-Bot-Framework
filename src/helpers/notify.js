let e = {
    bot: undefined,
    sendMessageToUser
};

async function sendMessageToUser(chat_id, message, key_board) {
    let extras = {};
    await e.bot.telegram.sendMessage(chat_id, message, extras);
}

export default e;