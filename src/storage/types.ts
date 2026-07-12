type Query = Record<string, unknown>;

interface StorageCursor<T = Record<string, any>> {
    sort(spec: Record<string, 1 | -1>): StorageCursor<T>;
    limit(count: number): StorageCursor<T>;
    toArray(): Promise<T[]>;
}

interface StorageCollection<T = Record<string, any>> {
    findOne<R = T>(query?: Query): Promise<R | null>;
    find<R = T>(query?: Query): StorageCursor<R>;
    insertOne(value: Record<string, any>): Promise<any>;
    updateOne(query: Query, update: { $set: Record<string, any> }, options?: { upsert?: boolean }): Promise<any>;
    updateMany(query: Query, update: { $set: Record<string, any> }): Promise<any>;
    deleteOne(query: Query): Promise<any>;
    deleteMany(query: Query): Promise<any>;
}

interface StorageClient {
    close(): void | Promise<void>;
}

interface StorageDatabase {
    driver: "mongodb" | "sqlite";
    client: StorageClient;
    collection_UserData: StorageCollection;
    collection_BotMessageHistory: StorageCollection;
    collection_UserMessageHistory: StorageCollection;
    collection_Data: StorageCollection;
    collection_Users: StorageCollection;
    collection_specialCommandsHistory: StorageCollection;
    collection_UserDataCollection: StorageCollection;
    collection_TempData: StorageCollection;
    collection_SharedData: StorageCollection;
}

type MongoStorageConfig = {
    driver: "mongodb";
    url?: string;
    dbName: string;
};

type SQLiteStorageConfig = {
    driver: "sqlite";
    filename?: string;
};

type StorageConfig = MongoStorageConfig | SQLiteStorageConfig;

export {
    MongoStorageConfig,
    Query,
    SQLiteStorageConfig,
    StorageClient,
    StorageCollection,
    StorageConfig,
    StorageCursor,
    StorageDatabase,
};
