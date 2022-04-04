import type { DB, TBFContext, Component, TBFConfig } from "../types";
declare const _default: ({ db, components, config }: {
    db: DB;
    components: Component[];
    config: TBFConfig;
}) => (_ctx: TBFContext, next: Function) => Promise<any>;
export default _default;
