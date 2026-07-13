import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { ObjectId } from "mongodb";

import type {
    Query,
    SQLiteStorageConfig,
    StorageCollection,
    StorageCursor,
    StorageDatabase,
} from "./types";

type StoredDocument = Record<string, any> & { _id: string };

function comparable(value: unknown): unknown {
    if (value && typeof value === "object" && "toHexString" in value) {
        return (value as { toHexString(): string }).toHexString();
    }
    if (value instanceof Date) return value.toISOString();
    return value;
}

function getPath(document: Record<string, any>, path: string): unknown {
    return path.split(".").reduce<unknown>((value, key) => {
        if (!value || typeof value !== "object") return undefined;
        return (value as Record<string, unknown>)[key];
    }, document);
}

function matches(document: StoredDocument, query: Query): boolean {
    return Object.entries(query).every(([path, expected]) => {
        const actual = comparable(getPath(document, path));
        if (expected && typeof expected === "object" && !(expected instanceof Date) && !("toHexString" in expected)) {
            const operators = expected as Record<string, unknown>;
            if ("$lte" in operators) return actual <= comparable(operators.$lte);
            if ("$lt" in operators) return actual < comparable(operators.$lt);
            if ("$gte" in operators) return actual >= comparable(operators.$gte);
            if ("$gt" in operators) return actual > comparable(operators.$gt);
            if ("$in" in operators && Array.isArray(operators.$in)) {
                return operators.$in.some(value => comparable(value) === actual);
            }
        }
        return actual === comparable(expected);
    });
}

class SQLiteCursor<T> implements StorageCursor<T> {
    #documents: T[];

    constructor(documents: T[]) {
        this.#documents = documents;
    }

    sort(spec: Record<string, 1 | -1>): StorageCursor<T> {
        const entries = Object.entries(spec);
        this.#documents.sort((left, right) => {
            for (const [path, direction] of entries) {
                const a = comparable(getPath(left as Record<string, any>, path));
                const b = comparable(getPath(right as Record<string, any>, path));
                if (a === b) continue;
                return (a < b ? -1 : 1) * direction;
            }
            return 0;
        });
        return this;
    }

    limit(count: number): StorageCursor<T> {
        this.#documents = this.#documents.slice(0, count);
        return this;
    }

    async toArray(): Promise<T[]> {
        return this.#documents;
    }
}

class SQLiteCollection implements StorageCollection {
    constructor(private readonly database: DatabaseSync, private readonly name: string) {}

    private readAll(): StoredDocument[] {
        const rows = this.database.prepare(
            "SELECT document FROM tbf_documents WHERE collection_name = ?",
        ).all(this.name) as Array<{ document: string }>;
        return rows.map(row => JSON.parse(row.document));
    }

    private write(document: StoredDocument): void {
        this.database.prepare(`
            INSERT INTO tbf_documents (collection_name, id, document)
            VALUES (?, ?, ?)
            ON CONFLICT(collection_name, id) DO UPDATE SET document = excluded.document
        `).run(this.name, document._id, JSON.stringify(document));
    }

    async findOne<T = StoredDocument>(query: Query = {}): Promise<T | null> {
        return (this.readAll().find(document => matches(document, query)) as T | undefined) ?? null;
    }

    find<T = StoredDocument>(query: Query = {}): StorageCursor<T> {
        return new SQLiteCursor(this.readAll().filter(document => matches(document, query)) as T[]);
    }

    async insertOne(value: Record<string, any>) {
        const document = { ...value, _id: value._id?.toString() ?? new ObjectId().toHexString() } as StoredDocument;
        this.write(document);
        return { acknowledged: true, insertedId: document._id };
    }

    async updateOne(query: Query, update: { $set: Record<string, any> }, options: { upsert?: boolean } = {}) {
        const current = await this.findOne<StoredDocument>(query);
        if (current) {
            this.write({ ...current, ...update.$set });
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedId: null };
        }
        if (options.upsert) {
            const base = Object.fromEntries(Object.entries(query).filter(([, value]) => typeof value !== "object"));
            const result = await this.insertOne({ ...base, ...update.$set });
            return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: result.insertedId };
        }
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: null };
    }

    async updateMany(query: Query, update: { $set: Record<string, any> }) {
        const documents = this.readAll().filter(document => matches(document, query));
        for (const document of documents) this.write({ ...document, ...update.$set });
        return { acknowledged: true, matchedCount: documents.length, modifiedCount: documents.length };
    }

    async deleteOne(query: Query) {
        const document = this.readAll().find(item => matches(item, query));
        if (document) {
            this.database.prepare(
                "DELETE FROM tbf_documents WHERE collection_name = ? AND id = ?",
            ).run(this.name, document._id);
        }
        return { acknowledged: true, deletedCount: document ? 1 : 0 };
    }

    async deleteMany(query: Query) {
        const documents = this.readAll().filter(document => matches(document, query));
        const remove = this.database.prepare(
            "DELETE FROM tbf_documents WHERE collection_name = ? AND id = ?",
        );
        for (const document of documents) remove.run(this.name, document._id);
        return { acknowledged: true, deletedCount: documents.length };
    }
}

export default async function createSQLiteStorage({ filename = "./data/tbf.sqlite" }: SQLiteStorageConfig): Promise<StorageDatabase> {
    const { DatabaseSync } = await import("node:sqlite");
    const databasePath = filename === ":memory:" ? filename : resolve(filename);
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });

    const client = new DatabaseSync(databasePath, { timeout: 5_000 });
    client.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS tbf_documents (
            collection_name TEXT NOT NULL,
            id TEXT NOT NULL,
            document TEXT NOT NULL,
            PRIMARY KEY (collection_name, id)
        ) STRICT;
        CREATE INDEX IF NOT EXISTS tbf_documents_collection
            ON tbf_documents (collection_name);
    `);

    const collection = (name: string) => new SQLiteCollection(client, name);
    return {
        driver: "sqlite",
        client,
        collection_UserData: collection("user_data"),
        collection_BotMessageHistory: collection("bot_message_history"),
        collection_UserMessageHistory: collection("user_message_history"),
        collection_Data: collection("other_data"),
        collection_Users: collection("users"),
        collection_specialCommandsHistory: collection("special_commands_history"),
        collection_UserDataCollection: collection("user_data_collection"),
        collection_TempData: collection("temp_data"),
        collection_SharedData: collection("shared_data"),
    };
}
