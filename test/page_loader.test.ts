import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import loadPages from "../src/page_loader";

test("page loader builds routes, persists oversized data, and opens a page", async () => {
  const root = mkdtempSync(join(tmpdir(), "tbf-loader-"));
  const pagesPath = join(root, "pages");
  const pluginsPath = join(root, "plugins");
  mkdirSync(pagesPath);
  mkdirSync(pluginsPath);
  writeFileSync(join(pagesPath, "index.js"), `
    module.exports = ({ parseButtons }) => ({
      actions: { main({ data }) { globalThis.__tbfOpenedWith = data; } },
      testParseButtons: parseButtons
    });
  `);

  const calls: Array<unknown[]> = [];
  const db = {
    tempData: {
      async add(...args: unknown[]) { calls.push(args); },
    },
    messages: {
      async removeMessages() { calls.push(["removeMessages"]); },
    },
    async setValue(_ctx: unknown, key: string, value: unknown) { calls.push(["setValue", key, value]); },
  } as never;
  const ctx = {
    chatId: 77,
    message: { message_id: 12 },
    from: { id: 77 },
  } as never;

  try {
    const { pages, plugins } = loadPages({
      db,
      config: {
        pages: { path: pagesPath },
        plugins: { path: pluginsPath },
        webServer: { address: "https://example.test", port: 8080 },
      },
    });
    const page = pages[0] as typeof pages[number] & { testParseButtons: Function };

    assert.equal(page.id, "index");
    assert.equal(page.type, "page");
    assert.deepEqual(plugins, []);

    const buttons = await page.testParseButtons({
      ctx,
      id: "index",
      buttons: [[{ text: "Open", action: "details", data: "x".repeat(100) }]],
    });
    assert.match(buttons[0][0].callback_data, /^index�details�X12\./);
    assert.equal(calls[0][0], 77);
    assert.equal(calls[0][1], "12");

    await page.open?.({ ctx, action: "main", data: { opened: true } });
    assert.deepEqual((globalThis as any).__tbfOpenedWith, { opened: true });
    assert.ok(calls.some(call => call[0] === "setValue" && call[1] === "step" && call[2] === "index�main"));
  } finally {
    delete (globalThis as any).__tbfOpenedWith;
    rmSync(root, { recursive: true, force: true });
  }
});
