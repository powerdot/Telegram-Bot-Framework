import type {
    PageActionData,
} from "./types"

function packData(data: PageActionData) {
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

function unpackData(raw_data: string) {
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
            default:
                unpackedData = cleared;
                break;
        }
    }
    return unpackedData as PageActionData;
}

export default {
    packData,
    unpackData,
}