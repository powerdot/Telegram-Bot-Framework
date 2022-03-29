import type { DB, TBFContext } from "../types"

module.exports = ({ db }: { db: DB }) => {
    return async function (ctx: TBFContext, next) {
        return next();
    }
}