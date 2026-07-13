import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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

test("paginator ignores declarations, source maps, and unrelated build assets", () => {
  const pagesPath = mkdtempSync(join(tmpdir(), "tbf-pages-"));
  writeFileSync(join(pagesPath, "index.js"), "module.exports = () => ({ actions: { main() {} } });\n");
  writeFileSync(join(pagesPath, "index.d.ts"), "declare const page: unknown; export = page;\n");
  writeFileSync(join(pagesPath, "index.js.map"), "{}\n");
  writeFileSync(join(pagesPath, "README.md"), "# Pages\n");
  writeFileSync(join(pagesPath, "metadata.json"), "{}\n");

  try {
    const paginator = createPaginator({ config: { pages: { path: pagesPath } } });
    const components = paginator.list("pages");

    assert.deepEqual(components.map(component => component.id), ["index"]);
  } finally {
    rmSync(pagesPath, { recursive: true, force: true });
  }
});

test("paginator supports directory entries and default exports", () => {
  const pagesPath = mkdtempSync(join(tmpdir(), "tbf-pages-"));
  const galleryPath = join(pagesPath, "gallery");
  mkdirSync(galleryPath);
  writeFileSync(join(galleryPath, "index.js"), "module.exports = { default: () => ({ actions: { main() {} } }) };\n");

  try {
    const paginator = createPaginator({ config: { pages: { path: pagesPath } } });
    const [component] = paginator.list("pages");

    assert.equal(component.id, "gallery");
    assert.equal(component.path, realpathSync(join(galleryPath, "index.js")));
    assert.equal(typeof component.module, "function");
  } finally {
    rmSync(pagesPath, { recursive: true, force: true });
  }
});
