import type { ComponentActionData, DB, TBFContext } from "./types";
declare function packData(data: ComponentActionData): string;
declare function unpackData(raw_data: string, db: DB, ctx: TBFContext): Promise<ComponentActionData>;
declare const _default: {
    packData: typeof packData;
    unpackData: typeof unpackData;
};
export default _default;
