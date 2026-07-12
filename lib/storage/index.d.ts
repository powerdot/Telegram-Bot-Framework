import type { MongoStorageConfig, StorageConfig, StorageDatabase } from "./types";
declare function resolveStorageConfig(storage?: StorageConfig, legacyMongo?: Omit<MongoStorageConfig, "driver">): StorageConfig;
export default function createStorage(config: StorageConfig): Promise<StorageDatabase>;
export { resolveStorageConfig };
export type { StorageConfig, StorageDatabase } from "./types";
