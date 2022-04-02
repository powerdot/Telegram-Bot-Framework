import { StartupChainInstances, TBFArgs } from "../types";
declare function activate({ telegram, mongo, webServer, config }: TBFArgs): Promise<StartupChainInstances>;
export default activate;
