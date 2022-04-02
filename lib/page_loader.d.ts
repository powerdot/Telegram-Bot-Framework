import type { Component, DB, TBFConfig, PaginatorReturn } from "./types";
declare const _default: ({ db, config }: {
    db: DB;
    config: TBFConfig;
}) => {
    pages: Component[];
    plugins: Component[];
    paginator: PaginatorReturn;
};
export default _default;
