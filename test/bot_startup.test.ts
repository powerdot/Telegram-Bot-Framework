import assert from "node:assert/strict";
import test from "node:test";

import { waitForBotLaunch } from "../src/startup_chain/bot";

test("bot startup resolves when Telegraf is ready without waiting for polling to stop", async () => {
  const neverEndingPolling = new Promise<void>(() => undefined);
  const bot = {
    launch(_config: object, onLaunch: () => void) {
      onLaunch();
      return neverEndingPolling;
    },
  };

  await waitForBotLaunch(bot);
});

test("bot startup rejects when Telegraf fails before launch", async () => {
  const failure = new Error("invalid token");
  const bot = {
    launch() {
      return Promise.reject(failure);
    },
  } as never;

  await assert.rejects(waitForBotLaunch(bot), failure);
});
