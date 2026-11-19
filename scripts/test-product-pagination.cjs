const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(href) {
  const source = readFileSync(path.join(__dirname, "..", "components", "ui", "ProductPagination.tsx"), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const window = {
    location: { href },
    history: {
      pushState(_state, _title, url) { window.location.href = String(url); },
      replaceState(_state, _title, url) { window.location.href = String(url); },
    },
  };
  vm.runInNewContext(code, {
    exports, URL, window,
    require(id) {
      if (id === "next/navigation") return { useSearchParams: () => new URL(window.location.href).searchParams };
      if (id === "react/jsx-runtime") return {};
      if (id === "@/lib/utils") return { formatNumber: String };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return { ...exports, window };
}

test("page selection uses 24 items and clamps invalid or out-of-range pages", () => {
  const pagination = load("https://example.test/clearance?page=3");
  assert.equal(pagination.useProductPage(50).start, 48);
  assert.equal(pagination.useProductPage(25).page, 2);
  pagination.window.location.href = "https://example.test/clearance?page=-1";
  assert.equal(pagination.useProductPage(50).page, 1);
});

test("page changes retain filters; filter changes reset the page", () => {
  const pagination = load("https://example.test/clearance?q=valve&brands=A&sort=az&page=2");
  pagination.updateProductParams({ page: "3" }, true);
  let params = new URL(pagination.window.location.href).searchParams;
  assert.equal(params.get("q"), "valve");
  assert.equal(params.get("brands"), "A");
  assert.equal(params.get("sort"), "az");
  assert.equal(params.get("page"), "3");
  pagination.updateProductParams({ brands: ["A", "B"] });
  params = new URL(pagination.window.location.href).searchParams;
  assert.equal(params.get("page"), null);
  assert.deepEqual(params.getAll("brands"), ["A", "B"]);
  assert.equal(params.get("q"), "valve");
});
