import assert from "node:assert/strict";
import test from "node:test";

import { declOfNum, parseCallbackPath } from "../src/helpers";

test("parseCallbackPath parses the current route and remaining callback chain", () => {
  const ctx = {
    updateType: "callback_query",
    callbackQuery: { data: "catalog�open�N42/details�main" },
  } as never;

  assert.deepEqual(parseCallbackPath(ctx), {
    current: { route: "catalog", action: "open", data: "N42" },
    all: [
      { route: "catalog", action: "open", data: "N42" },
      { route: "details", action: "main", data: undefined },
    ],
    next: "details�main",
  });
});

test("parseCallbackPath ignores non-callback updates", () => {
  assert.equal(parseCallbackPath({ updateType: "message" } as never), false);
});

test("declOfNum preserves Russian plural forms", () => {
  const forms = ["страница", "страницы", "страниц"];
  assert.equal(declOfNum(1, forms), "страница");
  assert.equal(declOfNum(2, forms), "страницы");
  assert.equal(declOfNum(11, forms), "страниц");
});
