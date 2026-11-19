const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function harness() {
  const states = [], refs = [], effects = [];
  let stateIndex = 0, refIndex = 0;
  return {
    effects,
    reset() { stateIndex = 0; refIndex = 0; effects.length = 0; },
    react: {
      createContext: () => ({ Provider: "provider" }),
      useState(initial) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      },
      useRef(initial) {
        const index = refIndex++;
        if (!(index in refs)) refs[index] = { current: initial };
        return refs[index];
      },
      useEffect: (effect) => effects.push(effect),
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
    },
  };
}

function load(file, h, window) {
  const source = readFileSync(path.join(__dirname, "..", file), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, window, console, Set, JSON,
    require(id) {
      if (id === "react") return h.react;
      if (id === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
      if (id === "@/components/providers/AuthProvider") return { useAuth: () => ({ authenticated: false, loading: false }) };
      if (id === "@/components/providers/ToastProvider") return { useToast: () => ({ toast() {} }) };
      if (id === "@/lib/analytics") return { track() {} };
      if (id === "@/lib/logger") return { logError() {} };
      if (id === "@/lib/customer-feedback") return { CustomerError: Error, customerErrorMessage: String };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return exports;
}

test("cart feedback only records additions that increase quantity", () => {
  const h = harness();
  const { CartProvider } = load("components/providers/CartProvider.tsx", h, {});
  const cart = CartProvider({ children: null }).props.value;
  const item = { productId: "1", maxQuantity: 2, unitPrice: 1, sku: "SKU" };
  assert.equal(cart.addItem(item), true);
  assert.equal(cart.addItem(item), true);
  assert.equal(cart.addItem(item), false);
  h.reset();
  const updated = CartProvider({ children: null }).props.value;
  assert.equal(updated.count, 2);
  assert.equal(updated.additionRevision, 2);
});

test("rapid guest saves retain both products and update the count", async () => {
  const h = harness();
  let stored = "[]";
  const localStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  const { SavedProductsProvider } = load("components/providers/SavedProductsProvider.tsx", h, { localStorage });
  SavedProductsProvider({ children: null });
  h.effects[0]();
  h.reset();
  const saved = SavedProductsProvider({ children: null }).props.value;
  await Promise.all([saved.toggle("1"), saved.toggle("2")]);
  assert.deepEqual(JSON.parse(stored), ["1", "2"]);
  h.reset();
  assert.equal(SavedProductsProvider({ children: null }).props.value.count, 2);
});
