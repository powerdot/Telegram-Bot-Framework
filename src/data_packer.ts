import type {
    ComponentActionData,
    DB,
    TBFContext
} from "./types"

function packData(data: ComponentActionData) {
    let packedData = "";
    let type = typeof data;
    switch (type) {
        case "string":
            packedData = "S" + data;
            break;
        case "number":
            packedData = "N" + data.toString();
            break;
        case "boolean":
            packedData = "B" + data.toString();
            break;
        case "object":
            packedData = "O" + JSON.stringify(data);
            break;
        default:
            return undefined;
    }
    return packedData as string | undefined;
}

async function unpackData(raw_data: string, db: DB, ctx: TBFContext) {
    let unpackedData = null;
    if (raw_data) {
        let data_type = raw_data[0];
        let cleared = raw_data.substring(1);
        switch (data_type) {
            case "S":
                unpackedData = cleared;
                break;
            case "N":
                unpackedData = Number(cleared);
                break;
            case "B":
                unpackedData = cleared.toLocaleLowerCase() === "true";
                break;
            case "O":
                unpackedData = JSON.parse(cleared);
                break;
            case "X":
                let route = cleared.split(".");
                let messagespace = route[0];
                let uniqid = route[1];
                unpackedData = await db.tempData.get(messagespace, uniqid);
                db.tempData.remove(messagespace);
                break;
            default:
                unpackedData = cleared;
                break;
        }
    }
    return unpackedData as ComponentActionData;
}

export default {
    packData,
    unpackData,
}