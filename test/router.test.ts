import assert from "node:assert/strict";
import test from "node:test";

import createRouter from "../src/bot_middlewares/router";

test("router dispatches callback data and waits for the component", async () => {
  const order: string[] = [];
  const db = {
    async getValue() { return "fallback�main"; },
  } as never;
  const component = {
    id: "catalog",
    actions: { main() {} },
    async call(ctx: { routing: { data?: unknown } }) {
      await Promise.resolve();
      assert.equal(ctx.routing.data, 42);
      order.push("component");
    },
  } as never;
  const ctx = {
    updateType: "callback_query",
    update: { callback_query: { data: "catalog�open�N42" } },
    callbackQuery: { data: "catalog�open�N42" },
    async answerCbQuery() { order.push("answer"); },
  } as never;

  await createRouter({ db, components: [component], config: {} })(ctx, async () => {
    order.push("next");
  });

  assert.deepEqual((ctx as { routing: unknown }).routing, {
    type: "callback_query",
    component: "catalog",
    action: "open",
    data: 42,
    step: "fallback�main",
    message: undefined,
    isMessageFromUser: false,
  });
  assert.deepEqual(order, ["answer", "component", "next"]);
});

test("router continues when an expired callback query cannot be answered", async () => {
  let routed = false;
  const db = { async getValue() { return undefined; } } as never;
  const component = {
    id: "catalog",
    actions: { main() {} },
    async call() { routed = true; },
  } as never;
  const ctx = {
    updateType: "callback_query",
    update: { callback_query: { data: "catalog�main" } },
    callbackQuery: { data: "catalog�main" },
    async answerCbQuery() { throw new Error("query is too old"); },
  } as never;

  await createRouter({ db, components: [component], config: {} })(ctx, async () => undefined);

  assert.equal(routed, true);
});

test("router falls back to the saved step for messages", async () => {
  let routed = false;
  const db = { async getValue() { return "profile�edit"; } } as never;
  const component = {
    id: "profile",
    actions: { main() {} },
    async call() { routed = true; },
  } as never;
  const message = { message_id: 5, text: "Arthur" };
  const ctx = { updateType: "message", update: { message } } as never;

  await createRouter({ db, components: [component], config: {} })(ctx, async () => undefined);

  assert.equal(routed, true);
  assert.deepEqual((ctx as { routing: any }).routing, {
    type: "message",
    component: "profile",
    action: "edit",
    data: undefined,
    step: "profile�edit",
    message,
    isMessageFromUser: true,
  });
});

test("router fans out unrouted Telegram events only to subscribed components", async () => {
  const calls: string[] = [];
  const db = { async getValue() { throw new Error("global events must not query a chat step"); } } as never;
  const subscribed = {
    id: "analytics",
    actions: { main() {} },
    events: { message_reaction() {} },
    async call() { calls.push("subscribed"); },
  } as never;
  const ignored = {
    id: "other",
    actions: { main() {} },
    events: { poll_answer() {} },
    async call() { calls.push("ignored"); },
  } as never;
  const ctx = { updateType: "message_reaction", update: { message_reaction: {} } } as never;

  await createRouter({ db, components: [subscribed, ignored], config: {} })(ctx, async () => calls.push("next"));

  assert.deepEqual(calls, ["subscribed", "next"]);
});

test("router debug output never logs the Telegram client or token", async () => {
  const output: unknown[][] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => { output.push(args); };
  const ctx = {
    updateType: "message_reaction",
    update: { update_id: 10, message_reaction: {} },
    telegram: { token: "secret-bot-token" },
    chatId: 1,
    fromId: 2,
  } as never;

  try {
    await createRouter({ db: {} as never, components: [], config: { debug: true } })(ctx, async () => undefined);
  } finally {
    console.log = originalLog;
  }

  assert.doesNotMatch(JSON.stringify(output), /secret-bot-token/);
  assert.match(JSON.stringify(output), /"chatId":1/);
});
