import assert from "node:assert/strict";
import test from "node:test";

import { stopBot } from "../src/helpers/stop_bot";

test("stopBot ignores an inactive Telegraf bot", () => {
  assert.doesNotThrow(() => stopBot({
    stop() { throw new Error("Bot is not running!"); },
  }, "test shutdown"));
});

test("stopBot forwards the shutdown signal", () => {
  let receivedSignal: string | undefined;

  stopBot({
    stop(signal) { receivedSignal = signal; },
  }, "SIGTERM");

  assert.equal(receivedSignal, "SIGTERM");
});

test("stopBot rethrows unexpected Telegraf errors", () => {
  const failure = new Error("polling shutdown failed");

  assert.throws(() => stopBot({
    stop() { throw failure; },
  }), error => error === failure);
});
