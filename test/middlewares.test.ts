import assert from "node:assert/strict";
import test from "node:test";

import createMarkUserMessages from "../src/bot_middlewares/mark_user_messages";
import createSetIds from "../src/bot_middlewares/set_ids";
import createSpamGuard from "../src/bot_middlewares/spam";

test("set_ids normalizes chat, user, and sender chat ids and continues", async () => {
  const ctx = {
    chat: { id: 123 },
    from: { id: 456 },
    message: { sender_chat: { id: -789 } },
  } as never;
  let continued = false;

  await createSetIds()(ctx, async () => { continued = true; });

  assert.equal((ctx as { chatId?: number }).chatId, 123);
  assert.equal((ctx as { fromId?: number }).fromId, 456);
  assert.equal((ctx as { senderChatId?: number }).senderChatId, -789);
  assert.equal(continued, true);
});

test("set_ids leaves unavailable sender ids undefined", async () => {
  const ctx = { chat: { id: 123 } } as never;

  await createSetIds()(ctx, async () => undefined);

  assert.equal((ctx as { fromId?: number }).fromId, undefined);
  assert.equal((ctx as { senderChatId?: number }).senderChatId, undefined);
});

test("mark_user_messages stores regular messages", async () => {
  const calls: string[] = [];
  const db = {
    messages: { user: {
      async addUserMessage() { calls.push("message"); },
      async addUserSpecialCommand() { calls.push("special"); },
    } },
  } as never;
  const ctx = { update: { message: { text: "hello" } } } as never;

  await createMarkUserMessages({ db })(ctx, async () => { calls.push("next"); });

  assert.deepEqual(calls, ["message", "next"]);
});

test("mark_user_messages stores start and reset as special commands", async () => {
  for (const command of ["/start", "/reset"]) {
    const calls: string[] = [];
    const db = {
      messages: { user: {
        async addUserMessage() { calls.push("message"); },
        async addUserSpecialCommand() { calls.push("special"); },
      } },
    } as never;
    const ctx = { update: { message: { text: command } } } as never;

    await createMarkUserMessages({ db })(ctx, async () => { calls.push("next"); });

    assert.deepEqual(calls, ["special", "next"]);
  }
});

test("spam guard blocks a second message from the same user in one second", async () => {
  const originalNow = Date.now;
  Date.now = () => 1_750_000_000_000;
  const ctx = { update: { message: { from: { id: 987654 } } } } as never;
  let nextCalls = 0;
  const middleware = createSpamGuard();

  try {
    assert.equal(await middleware(ctx, async () => { nextCalls += 1; return "continued"; }), "continued");
    assert.equal(await middleware(ctx, async () => { nextCalls += 1; }), false);
    assert.equal(nextCalls, 1);
  } finally {
    Date.now = originalNow;
  }
});
