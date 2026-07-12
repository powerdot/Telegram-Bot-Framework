"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createSQLiteStorage;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const mongodb_1 = require("mongodb");
function comparable(value) {
    if (value && typeof value === "object" && "toHexString" in value) {
        return value.toHexString();
    }
    if (value instanceof Date)
        return value.toISOString();
    return value;
}
function getPath(document, path) {
    return path.split(".").reduce((value, key) => {
        if (!value || typeof value !== "object")
            return undefined;
        return value[key];
    }, document);
}
function matches(document, query) {
    return Object.entries(query).every(([path, expected]) => {
        const actual = comparable(getPath(document, path));
        if (expected && typeof expected === "object" && !(expected instanceof Date) && !("toHexString" in expected)) {
            const operators = expected;
            if ("$lte" in operators)
                return actual <= comparable(operators.$lte);
            if ("$lt" in operators)
                return actual < comparable(operators.$lt);
            if ("$gte" in operators)
                return actual >= comparable(operators.$gte);
            if ("$gt" in operators)
                return actual > comparable(operators.$gt);
            if ("$in" in operators && Array.isArray(operators.$in)) {
                return operators.$in.some(value => comparable(value) === actual);
            }
        }
        return actual === comparable(expected);
    });
}
class SQLiteCursor {
    #documents;
    constructor(documents) {
        this.#documents = documents;
    }
    sort(spec) {
        const entries = Object.entries(spec);
        this.#documents.sort((left, right) => {
            for (const [path, direction] of entries) {
                const a = comparable(getPath(left, path));
                const b = comparable(getPath(right, path));
                if (a === b)
                    continue;
                return (a < b ? -1 : 1) * direction;
            }
            return 0;
        });
        return this;
    }
    limit(count) {
        this.#documents = this.#documents.slice(0, count);
        return this;
    }
    async toArray() {
        return this.#documents;
    }
}
class SQLiteCollection {
    database;
    name;
    constructor(database, name) {
        this.database = database;
        this.name = name;
    }
    readAll() {
        const rows = this.database.prepare("SELECT document FROM tbf_documents WHERE collection_name = ?").all(this.name);
        return rows.map(row => JSON.parse(row.document));
    }
    write(document) {
        this.database.prepare(`
            INSERT INTO tbf_documents (collection_name, id, document)
            VALUES (?, ?, ?)
            ON CONFLICT(collection_name, id) DO UPDATE SET document = excluded.document
        `).run(this.name, document._id, JSON.stringify(document));
    }
    async findOne(query = {}) {
        return this.readAll().find(document => matches(document, query)) ?? null;
    }
    find(query = {}) {
        return new SQLiteCursor(this.readAll().filter(document => matches(document, query)));
    }
    async insertOne(value) {
        const document = { ...value, _id: value._id?.toString() ?? new mongodb_1.ObjectId().toHexString() };
        this.write(document);
        return { acknowledged: true, insertedId: document._id };
    }
    async updateOne(query, update, options = {}) {
        const current = await this.findOne(query);
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
    async updateMany(query, update) {
        const documents = this.readAll().filter(document => matches(document, query));
        for (const document of documents)
            this.write({ ...document, ...update.$set });
        return { acknowledged: true, matchedCount: documents.length, modifiedCount: documents.length };
    }
    async deleteOne(query) {
        const document = this.readAll().find(item => matches(item, query));
        if (document) {
            this.database.prepare("DELETE FROM tbf_documents WHERE collection_name = ? AND id = ?").run(this.name, document._id);
        }
        return { acknowledged: true, deletedCount: document ? 1 : 0 };
    }
    async deleteMany(query) {
        const documents = this.readAll().filter(document => matches(document, query));
        const remove = this.database.prepare("DELETE FROM tbf_documents WHERE collection_name = ? AND id = ?");
        for (const document of documents)
            remove.run(this.name, document._id);
        return { acknowledged: true, deletedCount: documents.length };
    }
}
async function createSQLiteStorage({ filename = "./data/tbf.sqlite" }) {
    const { DatabaseSync } = await import("node:sqlite");
    const databasePath = filename === ":memory:" ? filename : (0, node_path_1.resolve)(filename);
    if (databasePath !== ":memory:")
        (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(databasePath), { recursive: true });
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
    const collection = (name) => new SQLiteCollection(client, name);
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
//# sourceMappingURL=sqlite.js.map