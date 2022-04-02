import type { TBFPromiseReturn, TBFArgs } from "./types";
declare let Create: ({ webServer, telegram, mongo, config }: TBFArgs) => Promise<TBFPromiseReturn>;
export default Create;
