import type { DB, TBFContext } from "../types";
declare const _default: ({ db }: {
    db: DB;
}) => (ctx: TBFContext, next: Function) => Promise<any>;
export default _default;
