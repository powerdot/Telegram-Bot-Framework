import type { TBFContext } from "../types"
let moment = require('moment');

let spam_store: {
    [key: number]: number
} = {};
export default () => {
    return async function (ctx: TBFContext, next) {
        if (!ctx.update) return next();
        let message = "message" in ctx.update ? ctx.update.message : null;
        if (!message) return next();
        let user_id = message.from.id;
        if (!spam_store[user_id]) spam_store[user_id] = moment().unix() - 10;
        if (spam_store[user_id] == moment().unix()) {
            console.warn('📛 SPAM:', user_id, 'is sending messages too fast');
            return false;
        }
        spam_store[user_id] = moment().unix();
        return next();
    }
}