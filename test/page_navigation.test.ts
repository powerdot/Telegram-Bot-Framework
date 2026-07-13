import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import loadPages from "../src/page_loader";

function callbackContext(step: string, component: string) {
  return {
    chatId: 77,
    updateType: "callback_query",
    routing: {
      type: "callback_query",
      component,
      action: "main",
      data: undefined,
      step,
      message: undefined,
      isMessageFromUser: false,
    },
  } as never;
}

test("page cleanup is consistent across programmatic and callback navigation", async () => {
  const root = mkdtempSync(join(tmpdir(), "tbf-navigation-"));
  const pagesPath = join(root, "pages");
  const pluginsPath = join(root, "plugins");
  mkdirSync(pagesPath);
  mkdirSync(pluginsPath);
  writeFileSync(join(pagesPath, "source.js"), `
    module.exports = () => ({
      clearChatOnOpen: false,
      actions: {
        main() { globalThis.__tbfSourceBinding = this; }
      }
    });
  `);
  writeFileSync(join(pagesPath, "progress.js"), `
    module.exports = () => ({
      actions: {
        main() {
          globalThis.__tbfNavigationOrder.push("progress");
          return "progress-result";
        }
      }
    });
  `);
  writeFileSync(join(pagesPath, "settings.js"), `
    module.exports = () => ({
      clearChatOnOpen: false,
      actions: {
        main() { globalThis.__tbfNavigationOrder.push("settings"); }
      }
    });
  `);

  const order: string[] = [];
  const db = {
    messages: {
      async removeMessages() { order.push("remove"); },
    },
    async setValue(_ctx: unknown, key: string, value: unknown) {
      if (key === "step") order.push(`step:${value}`);
    },
  } as never;
  (globalThis as any).__tbfNavigationOrder = order;

  try {
    const { pages } = loadPages({
      db,
      config: {
        pages: { path: pagesPath },
        plugins: { path: pluginsPath },
        clearChatOnPageOpen: true,
      },
    });
    const source = pages.find(page => page.id === "source")!;
    const progress = pages.find(page => page.id === "progress")!;
    const settings = pages.find(page => page.id === "settings")!;
    const sourceCtx = { chatId: 77 } as never;

    await source.open?.({ ctx: sourceCtx, action: "main", data: undefined });
    const sourceBinding = (globalThis as any).__tbfSourceBinding;

    order.length = 0;
    const result = await sourceBinding.goToPage({ page: "progress", action: "main" });
    assert.equal(result, "progress-result");
    assert.deepEqual(order, ["remove", "step:progress�main", "progress"]);

    order.length = 0;
    await sourceBinding.goToPage({ page: "settings", action: "main" });
    assert.deepEqual(order, ["step:settings�main", "settings"]);

    order.length = 0;
    await progress.call?.(callbackContext("source�main", "progress"));
    assert.deepEqual(order, ["remove", "step:progress�main", "progress"]);

    order.length = 0;
    await progress.call?.(callbackContext("progress�details", "progress"));
    assert.deepEqual(order, ["step:progress�main", "progress"]);

    order.length = 0;
    await settings.call?.(callbackContext("progress�main", "settings"));
    assert.deepEqual(order, ["step:settings�main", "settings"]);

    const noCleanupOrder: string[] = [];
    (globalThis as any).__tbfNavigationOrder = noCleanupOrder;
    const noCleanupDb = {
      messages: {
        async removeMessages() { noCleanupOrder.push("remove"); },
      },
      async setValue(_ctx: unknown, key: string, value: unknown) {
        if (key === "step") noCleanupOrder.push(`step:${value}`);
      },
    } as never;
    const { pages: pagesWithoutGlobalCleanup } = loadPages({
      db: noCleanupDb,
      config: {
        pages: { path: pagesPath },
        plugins: { path: pluginsPath },
        clearChatOnPageOpen: false,
      },
    });
    const progressWithoutGlobalCleanup = pagesWithoutGlobalCleanup.find(page => page.id === "progress")!;

    await progressWithoutGlobalCleanup.call?.(callbackContext("source�main", "progress"));
    assert.deepEqual(noCleanupOrder, ["step:progress�main", "progress"]);
  } finally {
    delete (globalThis as any).__tbfSourceBinding;
    delete (globalThis as any).__tbfNavigationOrder;
    rmSync(root, { recursive: true, force: true });
  }
});
