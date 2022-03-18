import type { DB, TBFContext } from "../types"

let checkSpecialFunction = async (db, oldfunction, ctx, args) => {
    let first_arg = args[0];
    let specialFunctions = ['delete'];
    let specialFunction = specialFunctions.filter(x => x == first_arg)[0];
    args = Array.from(args);
    if (specialFunction) args = args.slice(1);
    console.log('oldfunction', oldfunction);
    let a = await oldfunction.apply(null, args);
    switch (specialFunction) {
        case "delete":
            db.messages.addToRemoveMessages(ctx, a, true);
            break;
        default:
            break;
    }
    if (!specialFunction) db.messages.addToRemoveMessages(ctx, a, false);
    return a;
}

module.exports = ({ db }: { db: DB }) => {
    return async function (ctx: TBFContext, next) {
        await db.messages.removeMessages(ctx, true);
        let ctx_keys = Object.keys(ctx);
        for (let ctx_key of ctx_keys) {
            if (ctx_key.indexOf("reply") == 0) {
                let old_func = ctx[ctx_key];
                ctx[ctx_key] = (function (o, c) {
                    return function () {
                        return checkSpecialFunction(db, o, c, arguments);
                    }
                })(old_func, ctx)
            }
        }
        return next()
    }
}