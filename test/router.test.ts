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
  assert.deepEqual(order, ["component", "next"]);
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
