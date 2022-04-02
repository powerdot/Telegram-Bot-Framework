import type { TBFContext } from "../types";
declare function declOfNum(number: number, titles: string[]): string;
declare function parseCallbackPath(ctx: TBFContext): false | {
    current: any;
    all: any[];
    next: string | boolean;
};
declare const _default: {
    declOfNum: typeof declOfNum;
    parseCallbackPath: typeof parseCallbackPath;
};
export default _default;
