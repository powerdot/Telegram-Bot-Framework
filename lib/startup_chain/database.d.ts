import type { MongoStorageConfig, StorageDatabase } from '../storage/types';
export default function ({ url, dbName }: MongoStorageConfig): Promise<StorageDatabase>;
