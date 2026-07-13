import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import createPaginator from "../src/paginator";

test("paginator discovers CommonJS components", () => {
  const pagesPath = mkdtempSync(join(tmpdir(), "tbf-pages-"));
  writeFileSync(join(pagesPath, "index.js"), "module.exports = () => ({ actions: { main() {} } });\n");

  try {
    const paginator = createPaginator({ config: { pages: { path: pagesPath } } });
    const [component] = paginator.list("pages");

    assert.equal(component.id, "index");
    assert.equal(typeof component.module, "function");
    assert.equal(component.path, join(pagesPath, "index.js"));
  } finally {
    rmSync(pagesPath, { recursive: true, force: true });
  }
});

test("paginator returns an empty list for a missing directory", () => {
  const paginator = createPaginator({
    config: { pages: { path: join(tmpdir(), "tbf-directory-that-does-not-exist") } },
  });

  assert.deepEqual(paginator.list("pages"), []);
});
