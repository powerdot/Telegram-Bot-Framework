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
      clearChatOnOpen: false,
      actions: {
        main({ data }) { globalThis.__tbfOpenedWith = data; globalThis.__tbfBinding = this; },
        generate: {
          chatAction: "typing",
          async handler() { globalThis.__tbfGenerated = true; }
        }
      },
      events: {
        message_reaction(ctx) { globalThis.__tbfReactionEvent = { ctx, binding: this }; }
      },
      testParseButtons: parseButtons
    });
  `);

  const calls: Array<unknown[]> = [];
  const apiCalls: Array<[string, Record<string, any>]> = [];
  const db = {
    tempData: {
      async add(...args: unknown[]) { calls.push(args); },
    },
    messages: {
      async removeMessages() { calls.push(["removeMessages"]); },
      async addToRemoveMessages(...args: unknown[]) { calls.push(["track", ...args]); },
    },
    async setValue(_ctx: unknown, key: string, value: unknown) { calls.push(["setValue", key, value]); },
  } as never;
  const ctx = {
    chatId: 77,
    message: { message_id: 12 },
    from: { id: 77 },
    telegram: {
      async callApi(method: string, payload: Record<string, any>) {
        apiCalls.push([method, payload]);
        if (method === "sendPhoto") return { message_id: 900, from: { is_bot: true } };
        return true;
      },
      async sendMessage(chatId: number, text: string, options: Record<string, any>) {
        calls.push(["sendMessage", chatId, text, options]);
        return { message_id: 901, from: { is_bot: true } };
      },
    },
  } as never;

  try {
    const { pages, plugins } = loadPages({
      db,
      config: {
        pages: { path: pagesPath },
        plugins: { path: pluginsPath },
        chatActions: { stopOnNavigation: true },
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

    const removalsBeforeOpen = calls.filter(call => call[0] === "removeMessages").length;
    await page.open?.({ ctx, action: "main", data: { opened: true } });
    assert.deepEqual((globalThis as any).__tbfOpenedWith, { opened: true });
    assert.equal(calls.filter(call => call[0] === "removeMessages").length, removalsBeforeOpen);
    assert.ok(calls.some(call => call[0] === "setValue" && call[1] === "step" && call[2] === "index�main"));

    await page.open?.({ ctx, action: "main", data: { override: true }, clearChat: true });
    assert.equal(calls.filter(call => call[0] === "removeMessages").length, removalsBeforeOpen + 1);

    const binding = (globalThis as any).__tbfBinding;
    await binding.sendPhoto({ photo: "photo-id", options: { message_thread_id: 5 } });
    await binding.react("👍", { is_big: true });
    await binding.sendChatAction("typing", { message_thread_id: 5 });
    await binding.reply({ text: "Hello", options: { link_preview_options: { is_disabled: true } } });

    assert.deepEqual(apiCalls[0], ["sendPhoto", {
      chat_id: 77,
      photo: "photo-id",
      message_thread_id: 5,
    }]);
    assert.deepEqual(apiCalls[1], ["setMessageReaction", {
      chat_id: 77,
      message_id: 12,
      reaction: [{ type: "emoji", emoji: "👍" }],
      is_big: true,
    }]);
    assert.deepEqual(apiCalls[2], ["sendChatAction", {
      chat_id: 77,
      action: "typing",
      message_thread_id: 5,
    }]);

    const generated = await binding.withChatAction("typing", async () => "generated", {
      message_thread_id: 5,
      intervalDuration: 10000,
    });
    assert.equal(generated, "generated");
    assert.deepEqual(apiCalls[3], ["sendChatAction", {
      chat_id: 77,
      action: "typing",
      message_thread_id: 5,
    }]);

    const statusCallsBeforeRefresh = apiCalls.length;
    await binding.withChatAction("typing", async () => {
      await new Promise(resolve => setTimeout(resolve, 18));
    }, { intervalDuration: 5 });
    const statusCallsAfterRefresh = apiCalls.length;
    assert.ok(statusCallsAfterRefresh >= statusCallsBeforeRefresh + 2);
    await new Promise(resolve => setTimeout(resolve, 12));
    assert.equal(apiCalls.length, statusCallsAfterRefresh);

    await binding.withChatAction("typing", async () => {
      await binding.goToAction({ action: "generate" });
      const callsAfterNavigation = apiCalls.length;
      await new Promise(resolve => setTimeout(resolve, 12));
      assert.equal(apiCalls.length, callsAfterNavigation);
    }, { intervalDuration: 5 });

    await page.open?.({ ctx, action: "generate", data: undefined });
    assert.equal((globalThis as any).__tbfGenerated, true);
    assert.deepEqual(apiCalls.at(-1), ["sendChatAction", {
      chat_id: 77,
      action: "typing",
    }]);
    assert.ok(calls.some(call => call[0] === "track" && (call[2] as any[])[0].message_id === 900));
    assert.ok(calls.some(call => call[0] === "sendMessage"
      && (call[3] as any).reply_parameters.message_id === 12
      && (call[3] as any).link_preview_options.is_disabled === true));

    const reactionCtx = { updateType: "message_reaction", routing: { type: "message_reaction" } } as never;
    await page.call?.(reactionCtx);
    assert.equal((globalThis as any).__tbfReactionEvent.ctx, reactionCtx);
    assert.equal((globalThis as any).__tbfReactionEvent.binding.id, "index");
  } finally {
    delete (globalThis as any).__tbfOpenedWith;
    delete (globalThis as any).__tbfBinding;
    delete (globalThis as any).__tbfReactionEvent;
    delete (globalThis as any).__tbfGenerated;
    rmSync(root, { recursive: true, force: true });
  }
});
