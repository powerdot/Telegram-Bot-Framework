import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import loadPages from "../src/page_loader";

function routing(step: string, component: string) {
  return {
    type: "callback_query",
    component,
    action: "main",
    data: undefined,
    step,
    message: undefined,
    isMessageFromUser: false,
  };
}

test("callback and goToPage navigation preserve the message used by update", async () => {
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
  writeFileSync(join(pagesPath, "target.js"), `
    module.exports = () => ({
      actions: {
        main() { return this.update({ text: "Target" }); }
      }
    });
  `);

  let removals = 0;
  let edits = 0;
  const db = {
    messages: {
      async removeMessages() { removals += 1; },
    },
    async setValue() {},
  } as never;
  const ctx = {
    chatId: 77,
    updateType: "callback_query",
    routing: routing("source�main", "source"),
    async editMessageText() {
      edits += 1;
      return true;
    },
  } as never;

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
    const target = pages.find(page => page.id === "target")!;

    await source.open?.({ ctx, action: "main", data: undefined });
    const sourceBinding = (globalThis as any).__tbfSourceBinding;

    await sourceBinding.goToPage({ page: "target", action: "main" });
    assert.equal(removals, 0);
    assert.equal(edits, 1);

    (ctx as any).routing = routing("source�main", "target");
    await target.call?.(ctx);
    assert.equal(removals, 0);
    assert.equal(edits, 2);
  } finally {
    delete (globalThis as any).__tbfSourceBinding;
    rmSync(root, { recursive: true, force: true });
  }
});
