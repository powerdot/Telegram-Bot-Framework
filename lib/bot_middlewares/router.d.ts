import type { DB, TBFContext, Component } from "../types";
declare const _default: ({ db, components }: {
    db: DB;
    components: Component[];
}) => (_ctx: TBFContext, next: Function) => Promise<any>;
export default _default;
