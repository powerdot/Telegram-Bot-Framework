import type { TBFContext, Component, DB, TBFConfig, PaginatorReturn } from "./types";
export default _default;
declare function _default({ db, config }: {
    db: DB;
    config: TBFConfig;
}): {
    pages: Component[];
    plugins: Component[];
    paginator: PaginatorReturn;
    stopChatActions: (ctx: TBFContext) => void;
};
