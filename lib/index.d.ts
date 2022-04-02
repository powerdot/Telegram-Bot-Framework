import type { TBFArgs } from "./types";
declare let Create: ({ webServer, telegram, mongo, config }: TBFArgs) => Promise<unknown>;
export default Create;
