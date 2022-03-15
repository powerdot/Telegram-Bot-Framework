let config = require('../config');
let db = require("./helpers/db");
let moment = require("moment");

module.exports = async () => {
    console.log("✅ Auto remove check enabled");
    setInterval(async function () {
        let old_time = moment().add(-36, 'hours'); // 1.5 days
        if (config.autoRemoveMessages) {
            let msgs = await db.messages.findOldMessages(old_time.unix());
            let chats = msgs.map(x => x.chatId);
            chats = [...new Set(chats)];
            // console.log('Auto remove check, chats to clean:', chats);
            for (let chat of chats) {
                await db.messages.removeMessages(chat, false);
            }
            // console.log(msgs);
        }
    }, 60000);
}