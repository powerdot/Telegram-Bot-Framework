import assert from "node:assert/strict";
import test from "node:test";

import dataPacker from "../src/data_packer";

const ctx = {} as never;

test("callback data round-trips supported primitive and structured values", async () => {
  const values = ["hello", 42, true, false, { nested: [1, "two"] }, [1, 2, 3]];
  const db = {} as never;

  for (const value of values) {
    const packed = dataPacker.packData(value);
    assert.notEqual(packed, undefined);
    assert.deepEqual(await dataPacker.unpackData(packed!, db, ctx), value);
  }
});

test("temporary callback data is loaded and removed", async () => {
  const calls: string[] = [];
  const db = {
    tempData: {
      async get(messageSpace: string, uniqueId: string) {
        calls.push(`get:${messageSpace}:${uniqueId}`);
        return { payload: true };
      },
      async remove(messageSpace: string) {
        calls.push(`remove:${messageSpace}`);
      },
    },
  } as never;

  assert.deepEqual(await dataPacker.unpackData("X123.456", db, ctx), { payload: true });
  assert.deepEqual(calls, ["get:123:456", "remove:123"]);
});
