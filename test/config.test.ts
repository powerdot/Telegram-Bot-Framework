import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";

import { resolveConfig } from "../src/config";

test("config defaults preserve historical TBF behavior", () => {
  const config = resolveConfig({}, "/tmp/tbf-app");

  assert.deepEqual(config, {
    pages: { path: join("/tmp/tbf-app", "pages") },
    plugins: { path: join("/tmp/tbf-app", "plugins") },
    autoRemoveMessages: true,
    clearChatOnPageOpen: true,
    spamProtection: true,
    debug: false,
    gracefulShutdown: { handleSignals: false },
    chatActions: { stopOnNavigation: false },
    webServer: { port: 8080, address: "" },
  });
});

test("config preserves explicit false values and merges nested defaults", () => {
  const config = resolveConfig({
    autoRemoveMessages: false,
    clearChatOnPageOpen: false,
    spamProtection: false,
    gracefulShutdown: { handleSignals: false },
    chatActions: { stopOnNavigation: true },
    webServer: { address: "http://localhost:3000" } as never,
  }, "/tmp/tbf-app");

  assert.equal(config.autoRemoveMessages, false);
  assert.equal(config.clearChatOnPageOpen, false);
  assert.equal(config.spamProtection, false);
  assert.equal(config.chatActions.stopOnNavigation, true);
  assert.deepEqual(config.webServer, {
    port: 8080,
    address: "http://127.0.0.1:3000",
  });
});
