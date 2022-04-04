import type { TBFContext, CallbackPath } from "../types";
declare function declOfNum(number: number, titles: string[]): string;
declare function parseCallbackPath(ctx: TBFContext): CallbackPath;
export { declOfNum, parseCallbackPath };
