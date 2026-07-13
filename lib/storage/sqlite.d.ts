import type { SQLiteStorageConfig, StorageDatabase } from "./types";
export default function createSQLiteStorage({ filename }: SQLiteStorageConfig): Promise<StorageDatabase>;
