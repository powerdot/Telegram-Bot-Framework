import type { DB, TBFContext } from "../types";
export default _default;
declare function _default({ db }: {
    db: DB;
}): (ctx: TBFContext, next: Function) => Promise<any>;
