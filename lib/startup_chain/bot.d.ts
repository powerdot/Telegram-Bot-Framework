import { Telegraf } from "telegraf";
import { TBFContext } from "../types";
export default function ({ token, apiUrl }: {
    token: string;
    apiUrl?: string;
}): Promise<Telegraf<TBFContext>>;
