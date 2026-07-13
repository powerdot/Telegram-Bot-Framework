import type { DB, TBFContext, Component, TBFConfig } from "../types";
export default _default;
declare function _default({ db, components, config }: {
    db: DB;
    components: Component[];
    config: TBFConfig;
}): (_ctx: TBFContext, next: Function) => Promise<any>;
