import createMongoStorage from "../startup_chain/database";
import createSQLiteStorage from "./sqlite";
import type { MongoStorageConfig, StorageConfig, StorageDatabase } from "./types";

function resolveStorageConfig(
    storage?: StorageConfig,
    legacyMongo?: Omit<MongoStorageConfig, "driver">,
): StorageConfig {
    if (storage) return storage;
    if (legacyMongo) return { driver: "mongodb", ...legacyMongo };
    return { driver: "sqlite", filename: "./data/tbf.sqlite" };
}

export default function createStorage(config: StorageConfig): Promise<StorageDatabase> {
    if (config.driver === "mongodb") return createMongoStorage(config);
    return createSQLiteStorage(config);
}

export { resolveStorageConfig };
export type { StorageConfig, StorageDatabase } from "./types";
