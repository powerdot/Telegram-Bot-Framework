let e = {
    bot: undefined,
    sendMessageToUser
};

let keyboard_builder = require("./keyboard_builder");

async function sendMessageToUser(chat_id, message, key_board) {
    let extras = {};
    await e.bot.telegram.sendMessage(chat_id, message, extras);
}

module.exports = e;