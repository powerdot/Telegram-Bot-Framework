import type { DB } from "./types";

export default ({ db }: { db: DB }) => {
    let moment = require('moment');

    return setInterval(async function () {
        let old_time = moment().add(-36, 'hours'); // 1.5 days
        let msgs = await db.messages.findOldMessages(old_time.unix());
        let chats: Array<number> = msgs.map(x => Number(x?.chatId));
        chats = Array.from(new Set(chats));
        for (let chat of chats) {
            await db.messages.removeMessages(chat, false, false);
        }
    }, 60000);
}