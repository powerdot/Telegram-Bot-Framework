import { Telegraf } from "telegraf";
import { TBFContext } from "../types";
type LaunchableBot = {
    launch(config: object, onLaunch: () => void): Promise<void>;
};
declare function waitForBotLaunch(bot: LaunchableBot): Promise<void>;
export default function ({ token, apiUrl }: {
    token: string;
    apiUrl?: string;
}): Promise<Telegraf<TBFContext>>;
export { waitForBotLaunch };
