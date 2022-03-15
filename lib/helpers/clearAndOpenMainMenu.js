let config = require("../../config");
let keyboard_builder = require("./keyboard_builder");
let db = require("./db");
let users = require('./users');
let helpers = require("./index");

module.exports = async (ctx, msg) => {
    try {
        let chatId = helpers.getChatId(ctx);

        await db.messages.markAllMessagesAsTrash(chatId);

        await db.setValue(chatId, 'step', "main_menu");

        if (!msg) msg = (await keyboard_builder.main_menu(chatId, { action_text: 'cancel' })).action_text;

        await users.sendMessages([chatId], msg);

        console.log('🗑', "removing all old messages")
        await db.messages.removeMessages(chatId, true);
    } catch (error) {
        console.error("ERROR WHILE clearAndOpenMainMenu:", error);
    }
}