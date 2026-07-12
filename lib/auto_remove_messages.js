"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ db }) => {
    return setInterval(async function () {
        const thirtySixHoursAgo = Math.floor((Date.now() - 36 * 60 * 60 * 1000) / 1000);
        let msgs = await db.messages.findOldMessages(thirtySixHoursAgo);
        let chats = msgs.map(x => Number(x?.chatId));
        chats = Array.from(new Set(chats));
        for (let chat of chats) {
            await db.messages.removeMessages(chat, false, false);
        }
    }, 60000);
};
//# sourceMappingURL=auto_remove_messages.js.map