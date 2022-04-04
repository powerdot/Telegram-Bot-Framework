import type { ComponentExport, TBFPromiseReturn, TBFArgs } from "./types";
declare let Create: ({ webServer, telegram, mongo, config }: TBFArgs) => Promise<TBFPromiseReturn>;
declare function ComponentInit(fn: ComponentExport): ComponentExport;
export { Create as TBF, ComponentInit as Component };
