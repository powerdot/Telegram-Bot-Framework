import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import createDB from "../src/helpers/db";
import { resolveStorageConfig } from "../src/storage";
import createSQLiteStorage from "../src/storage/sqlite";

test("storage configuration defaults to SQLite and preserves legacy MongoDB config", () => {
  assert.deepEqual(resolveStorageConfig(), {
    driver: "sqlite",
    filename: "./data/tbf.sqlite",
  });
  assert.deepEqual(resolveStorageConfig(undefined, { url: "mongodb://db", dbName: "legacy" }), {
    driver: "mongodb",
    url: "mongodb://db",
    dbName: "legacy",
  });
  assert.deepEqual(resolveStorageConfig({ driver: "sqlite", filename: "custom.sqlite" }, { dbName: "ignored" }), {
    driver: "sqlite",
    filename: "custom.sqlite",
  });
});

test("SQLite persists data in a standalone file and creates parent directories", async () => {
  const root = mkdtempSync(join(tmpdir(), "tbf-sqlite-"));
  const filename = join(root, "nested", "bot.sqlite");
  let storage = await createSQLiteStorage({ driver: "sqlite", filename });

  try {
    await storage.collection_UserData.insertOne({ chatId: 1, name: "language", value: "ru" });
    await storage.client.close();
    assert.equal(existsSync(filename), true);

    storage = await createSQLiteStorage({ driver: "sqlite", filename });
    assert.equal((await storage.collection_UserData.findOne({ chatId: 1, name: "language" }))?.value, "ru");
  } finally {
    await storage.client.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("SQLite collection implements the shared document contract", async () => {
  const storage = await createSQLiteStorage({ driver: "sqlite", filename: ":memory:" });
  const collection = storage.collection_Data;

  try {
    const first = await collection.insertOne({ type: "post", score: 1 });
    await collection.insertOne({ type: "post", score: 3 });
    await collection.insertOne({ type: "other", score: 2 });

    assert.match(first.insertedId, /^[a-f\d]{24}$/);
    assert.equal((await collection.findOne({ _id: first.insertedId }))?.score, 1);
    assert.deepEqual(
      (await collection.find({ type: "post", score: { $gte: 1 } }).sort({ score: -1 }).limit(1).toArray())
        .map(document => document.score),
      [3],
    );
    assert.equal((await collection.find({ score: { $lt: 2 } }).toArray()).length, 1);
    assert.equal((await collection.find({ score: { $lte: 2 } }).toArray()).length, 2);
    assert.equal((await collection.find({ score: { $gt: 2 } }).toArray()).length, 1);
    assert.equal((await collection.find({ score: { $in: [1, 3] } }).toArray()).length, 2);

    assert.equal((await collection.updateOne({ _id: first.insertedId }, { $set: { score: 5 } })).modifiedCount, 1);
    assert.equal((await collection.findOne({ _id: first.insertedId }))?.score, 5);

    const upsert = await collection.updateOne(
      { type: "created-by-upsert" },
      { $set: { enabled: true } },
      { upsert: true },
    );
    assert.ok(upsert.upsertedId);
    assert.equal((await collection.findOne({ type: "created-by-upsert" }))?.enabled, true);

    assert.equal((await collection.updateMany({ type: "post" }, { $set: { published: true } })).modifiedCount, 2);
    assert.equal((await collection.find({ published: true }).toArray()).length, 2);
    assert.equal((await collection.deleteOne({ type: "other" })).deletedCount, 1);

    assert.equal((await collection.deleteMany({ type: "post" })).deletedCount, 2);
    assert.equal((await collection.find({}).toArray()).length, 1);
  } finally {
    await storage.client.close();
  }
});

test("DB facade behaves consistently on SQLite", async () => {
  const storage = await createSQLiteStorage({ driver: "sqlite", filename: ":memory:" });
  const bot = { telegram: { async deleteMessage() {} } } as never;
  const db = createDB(bot, storage, { debug: false });
  const ctx = { chatId: 42 } as never;

  try {
    await db.setValue(ctx, "step", "index�main");
    assert.equal(await db.getValue(ctx, "step"), "index�main");
    await db.removeValue(ctx, "step");
    assert.equal(await db.getValue(ctx, "step"), undefined);

    await db.tempData.add(42, "100", "1", { long: true });
    assert.deepEqual(await db.tempData.get("100", "1"), { long: true });
    await db.tempData.remove("100");
    assert.equal(await db.tempData.get("100", "1"), undefined);

    const users = db.user.collection(ctx, "preferences");
    const inserted = await users.insert({ theme: "dark" });
    assert.equal((await users.find({ _id: inserted.insertedId }))?.theme, "dark");
    await users.update({ _id: inserted.insertedId }, { theme: "light" });
    assert.equal((await users.find({ _id: inserted.insertedId }))?.theme, "light");
  } finally {
    await storage.client.close();
  }
});
