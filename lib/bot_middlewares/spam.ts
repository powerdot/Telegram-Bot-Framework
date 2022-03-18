import type { TBFContext } from "../types"
let moment = require('moment');

let spam_store = {};
module.exports = () => {
    return async function (ctx: TBFContext, next) {
        if (!ctx.update) return next();
        if (!ctx.update.message) return next();
        let user_id = ctx.update.message.from.id;
        if (!spam_store[user_id]) spam_store[user_id] = moment().unix() - 10;
        if (spam_store[user_id] == moment().unix()) {
            console.log('📛 SPAM:', user_id, 'is sending messages too fast');
            return false;
        }
        spam_store[user_id] = moment().unix();
        return next();
    }
}