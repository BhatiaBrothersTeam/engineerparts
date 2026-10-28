const assert=require("node:assert/strict");
const { readFileSync }=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const { test }=require("node:test");
const ts=require("typescript");

const root=path.resolve(__dirname,"..");
const address={
  firstName: "Saanvi",lastName: "S",company: "",country: "AE",
  address1: "123 Main Street",address2: "",city: "Dubai",state: "",postalCode: "",
};
const cartLine = {
  productId: "1", sku: "PART-1", name: "Part", slug: "part", brand: "Brand",
  condition: "New Surplus", unitPrice: 100, currency: "AED", quantity: 2,
  maxQuantity: 10, image: "", warehouse: "Dubai",
};

function hooks(initial=[]) {
  const states=[...initial];
  const effects=[];
  const refs=[];
  let index=0;
  let refIndex=0;
  return {
    states,
    effects,
    rerender() { index=0; refIndex=0; effects.length=0; },
    react: {
      isValidElement: (value) => Boolean(value && typeof value === "object" && "type" in value && "props" in value),
      createContext: () => ({ Provider: "provider" }),
      useState(value) {
        const slot=index++;
        if(!(slot in states)) states[slot]=value;
        return [states[slot],(next) => {
          states[slot]=typeof next==="function"? next(states[slot]):next;
        }];
      },
      useRef: (current) => {
        const slot=refIndex++;
        if (!(slot in refs)) refs[slot]={ current };
        return refs[slot];
      },
      useEffect: (fn) => effects.push(fn),
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
    },
  };
}

function load(file,mocks={},globals={},extra="") {
  const source=readFileSync(path.join(root,file),"utf8")+extra;
  const { outputText }=ts.transpileModule(source,{
    compilerOptions: { target: ts.ScriptTarget.ES2020,module: ts.ModuleKind.CommonJS,jsx: ts.JsxEmit.ReactJSX },
  });
  const exports={};
  const jsx=(type,props) => ({ type,props });
  vm.runInNewContext(outputText,{
    exports,console,process,AbortController,AbortSignal,URL,Buffer,Error,TypeError,DOMException,
    require: (id) => {
      if(id==="react/jsx-runtime") return { jsx,jsxs: jsx };
      if(id.startsWith("node:")) return require(id);
      if(Object.hasOwn(mocks,id)) return mocks[id];
      if(id==="@/lib/customer-feedback") return load("lib/customer-feedback.ts",mocks,globals);
      if(id==="@/lib/utils") return load("lib/utils.ts");
      if(id==="@/lib/logger") return { logError() { } };
      if(id==="@/components/providers/ToastProvider") return { useToast: () => ({ toast() { } }) };
      if(id.startsWith("@/")||id.startsWith("next/")) return {};
      throw new Error(`Unexpected dependency: ${id}`);
    },
    ...globals,
  },{ filename: file });
  return exports;
}

function find(node,predicate) {
  if(!node||typeof node!=="object") return undefined;
  if(predicate(node)) return node;
  for(const child of [node.props?.children].flat(Infinity)) {
    const match=find(child,predicate);
    if(match) return match;
  }
}

test("checkout advances with a single-character surname but rejects blank names",() => {
  for(const lastName of ["S"," "]) {
    const h=hooks([{
      billing: { ...address,lastName,email: "user@example.com",phone: "+9711234567890" },
      shipping: address,sameAsBilling: true,
    }]);
    const { CheckoutForm }=load("components/cart/CheckoutForm.tsx",{
      react: h.react,
      "@/components/providers/CartProvider": { useCart: () => ({ ready: true,items: [{ productId: "1" }] }) },
      "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: true }) },
      "@/lib/utils": load("lib/utils.ts"),
    });
    const tree=CheckoutForm({ countries: [] });
    find(tree,(node) => node.type==="button"&&node.props.children==="Next").props.onClick();
    assert.equal(h.states[1],lastName==="S"? 2:1);
    assert.equal(h.states[5],lastName==="S"? null:"Enter last name.");
  }
});

test("order API accepts single-character names and still rejects empty names and invalid contact details",() => {
  const { validPayload }=load("app/api/orders/route.ts",{
    "@/lib/utils": load("lib/utils.ts"),
  },{},"\nexport { validPayload };");
  const payload={
    order_id: "ORD-test123",customer: { billing: { ...address,email: "user@example.com",phone: "+9711234567890" } },
    items: [{ productId: "1",quantity: 1 }],acceptPolicies: true,
  };
  assert.equal(validPayload(payload),true);
  for(const changes of [{ firstName: "A" },{ lastName: " " },{ firstName: "" },{ email: "bad" },{ phone: "123" }]) {
    const candidate={ ...payload,customer: { billing: { ...payload.customer.billing,...changes } } };
    assert.equal(validPayload(candidate),changes.firstName==="A");
  }
  assert.equal(validPayload({ ...payload,customer: { ...payload.customer,shipping: { ...address,firstName: "A" } } }),true);
});

test("cart clear resets items, totals, destination and checkout storage even when storage is unavailable",() => {
  for(const blocked of [false,true]) {
    const h=hooks([[{ productId: "1" }],true,{ total: 99 },"US",true,true]);
    const removed=[];
    const errors=[];
    const storage={
      removeItem(key) {
        removed.push(key);
        if(blocked) throw new Error("Storage blocked");
      },
    };
    const { CartProvider }=load("components/providers/CartProvider.tsx",{
      react: h.react,"@/lib/logger": { logError: (...args) => errors.push(args) },
    },{ window: { localStorage: storage,sessionStorage: storage } });
    CartProvider({ children: null }).props.value.clear();
    assert.equal(h.states[0].length,0);
    assert.equal(h.states[2],null);
    assert.equal(h.states[3],"AE");
    assert.equal(h.states[4],false);
    assert.equal(h.states[5],false);
    assert.deepEqual(removed,["engineerparts.checkout.reference","engineerparts.cart.v2"]);
    assert.equal(errors.length,blocked? 2:0);
  }
});

test("cart clearing is synchronized across tabs without storage write loops", () => {
  for (const event of [
    { key: "engineerparts.cart.v2", newValue: null },
    { key: "engineerparts.cart.v2", newValue: "[]" },
    { key: null, newValue: null },
    { key: "other-setting", newValue: null },
    { key: "engineerparts.cart.v2", newValue: '[{"productId":"2"}]' },
  ]) {
    const h = hooks([[{ productId: "1" }], true, { total: 99 }, "US", true, true]);
    const listeners = new Map();
    const removed = [];
    const storage = { removeItem() { throw new Error("Remote clear must not remove shared storage again"); } };
    const { CartProvider } = load("components/providers/CartProvider.tsx", { react: h.react }, {
      window: {
        localStorage: storage,
        sessionStorage: { removeItem: (key) => removed.push(key) },
        addEventListener: (name, handler) => listeners.set(name, handler),
        removeEventListener: (name, handler) => {
          assert.equal(listeners.get(name), handler);
          listeners.delete(name);
        },
      },
    });
    CartProvider({ children: null });
    const cleanup = h.effects.at(-1)();
    listeners.get("storage")({ ...event, storageArea: {} });
    assert.equal(h.states[0].length, 1, "Session storage events must not clear the cart");
    listeners.get("storage")({ ...event, storageArea: storage });
    const shouldClear = event.key === null || (event.key === "engineerparts.cart.v2" && (event.newValue === null || event.newValue === "[]"));
    assert.equal(h.states[0].length, shouldClear ? 0 : 1);
    if (shouldClear) {
      assert.equal(h.states[2], null);
      assert.equal(h.states[3], "AE");
      assert.deepEqual(removed, ["engineerparts.checkout.reference"]);
    }
    cleanup();
    assert.equal(listeners.size, 0);
  }
});

test("history-restored pages discard a cart cleared while the page was suspended", () => {
  for (const saved of [null, "[]", JSON.stringify([cartLine])]) {
    const h = hooks([[{ productId: "1" }], true, { total: 99 }, "US", false, false]);
    const listeners = new Map();
    const { CartProvider } = load("components/providers/CartProvider.tsx", { react: h.react }, {
      window: {
        localStorage: { getItem: (key) => key === "engineerparts.cart.customer" ? null : saved },
        sessionStorage: { removeItem() {} },
        addEventListener: (name, handler) => listeners.set(name, handler),
        removeEventListener() {},
      },
    });
    CartProvider({ children: null });
    h.effects.at(-1)();
    listeners.get("pageshow")({ persisted: false });
    assert.equal(h.states[0].length, 1);
    listeners.get("pageshow")({ persisted: true });
    assert.equal(h.states[0].length, saved === null || saved === "[]" ? 0 : 1);
  }
});

test("successful logout hides the customer cart; HTTP/network failures preserve the session and cart",async () => {
  for(const outcome of ["success","http-error","network-error"]) {
    const customer={ id: 123 };
    const h=hooks([customer,false]);
    const calls=[];
    const { AuthProvider }=load("components/providers/AuthProvider.tsx",{
      react: h.react,
      "next/navigation": { useRouter: () => ({ push: (url) => calls.push(url),refresh: () => calls.push("refresh") }) },
      "@/components/providers/CartProvider": { useCart: () => ({ selectCustomer: (id) => { assert.equal(id, null); calls.push("guest"); } }) },
      "@/components/providers/ToastProvider": { useToast: () => ({ toast: () => calls.push("toast") }) },
      "@/lib/logger": { logError: () => calls.push("log") },
    },{
      fetch: async () => {
        if(outcome==="network-error") throw new Error("Network unavailable");
        return { ok: outcome==="success",status: outcome==="success"? 200:503,json: async () => ({ ok: outcome==="success" }) };
      },
    });
    await AuthProvider({ children: null }).props.value.logout();
    assert.equal(h.states[0],outcome==="success"? null:customer);
    assert.deepEqual(calls,outcome==="success"? ["guest","/","refresh"]:["log","log","toast"]);
  }
});

function customerCartHarness(storage = new Map()) {
  const h = hooks();
  const listeners = new Map();
  const notices = [];
  const removed = [];
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const { CartProvider } = load("components/providers/CartProvider.tsx", {
    react: h.react,
    "@/lib/analytics": { track() {} },
    "@/components/providers/ToastProvider": { useToast: () => ({ toast: (message) => notices.push(message) }) },
  }, { window: {
    localStorage,
    sessionStorage: { removeItem: (key) => removed.push(key) },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  } });
  const render = () => {
    h.rerender();
    return CartProvider({ children: null }).props.value;
  };
  return { h, render, storage, listeners, notices, removed, localStorage };
}

test("customer cart survives logout and reload, stays hidden for guests and other customers, and clears after checkout", () => {
  const cart = customerCartHarness();
  assert.equal(cart.render().ready, false, "Wait for the session before displaying a saved cart");
  cart.render().selectCustomer(123);
  cart.render().addItem(cartLine, 2);
  cart.render();
  cart.h.effects[0]();
  cart.render().selectCustomer(null);
  assert.equal(cart.render().items.length, 0);
  assert.equal(JSON.parse(cart.storage.get("engineerparts.cart.v2.customer.123"))[0].quantity, 2);
  cart.render().selectCustomer(456);
  assert.equal(cart.render().items.length, 0);
  cart.render().selectCustomer(123);
  assert.equal(cart.render().items[0].quantity, 2);

  const reloaded = customerCartHarness(cart.storage);
  reloaded.render().selectCustomer(123);
  assert.equal(reloaded.render().items[0].quantity, 2);
  assert.equal(reloaded.removed.length, 0, "Reloading the same account preserves checkout retry protection");
  reloaded.render().clear();
  reloaded.render().selectCustomer(null);
  reloaded.render().selectCustomer(123);
  assert.equal(reloaded.render().items.length, 0, "Purchased or explicitly cleared items must not return");
});

test("guest additions merge once into the signed-in cart without exceeding stock or exposing the saved cart on logout", () => {
  const cart = customerCartHarness(new Map([
    ["engineerparts.cart.v2", JSON.stringify([{ ...cartLine, quantity: 3 }])],
    ["engineerparts.cart.v2.customer.123", JSON.stringify([{ ...cartLine, quantity: 9 }])],
  ]));
  cart.render().selectCustomer(null);
  assert.equal(cart.render().items[0].quantity, 3);
  cart.render().selectCustomer(123);
  assert.equal(cart.render().items[0].quantity, 10);
  assert.equal(cart.storage.has("engineerparts.cart.v2"), false);
  cart.render().selectCustomer(null);
  assert.equal(cart.render().items.length, 0);
  cart.render().selectCustomer(123);
  assert.equal(cart.render().items[0].quantity, 10);
});

test("existing unscoped carts migrate to the authenticated customer instead of disappearing or reappearing after logout", () => {
  const cart = customerCartHarness(new Map([
    ["engineerparts.cart.v2", JSON.stringify([cartLine])],
  ]));
  cart.render().selectCustomer(123);
  assert.equal(cart.render().items[0].quantity, 2);
  assert.equal(cart.storage.has("engineerparts.cart.v2"), false);
  cart.render().selectCustomer(null);
  assert.equal(cart.render().items.length, 0);
  cart.render().selectCustomer(123);
  assert.equal(cart.render().items[0].quantity, 2);
});

test("clearing browser storage resets ownership and allows the current session to initialize a new cart", () => {
  const cart = customerCartHarness();
  cart.render().selectCustomer(123);
  cart.render();
  cart.h.effects.at(-1)();
  cart.storage.clear();
  cart.listeners.get("storage")({ key: null, newValue: null, storageArea: cart.localStorage });
  assert.equal(cart.render().ready, false);
  cart.render().selectCustomer(123);
  cart.render().addItem(cartLine, 1);
  cart.render();
  cart.h.effects[0]();
  assert.equal(JSON.parse(cart.storage.get("engineerparts.cart.v2.customer.123"))[0].quantity, 1);
});

test("products added while the session loads are retained when the correct saved cart becomes available", () => {
  for (const id of [null, 123]) {
    const cart = customerCartHarness();
    cart.render().addItem(cartLine, 2);
    cart.render().selectCustomer(id);
    assert.equal(cart.render().items[0].quantity, 2);
  }
});

test("confirmed checkout waits for the customer cart to load before clearing it", () => {
  const h = hooks();
  let ready = false;
  let clears = 0;
  const { OrderSuccessView } = load("components/checkout/OrderSuccessView.tsx", {
    react: h.react,
    "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: true }) },
    "@/components/providers/CartProvider": { useCart: () => ({ ready, clear: () => { clears += 1; } }) },
  });
  const render = () => {
    h.rerender();
    OrderSuccessView({ initialOrder: { status: "processing", paymentMethod: "cod", total: "200", currency: "AED" }, orderId: 42, orderKey: "wc_order_test12345642" });
    h.effects[1]();
  };
  render();
  assert.equal(clears, 0);
  ready = true;
  render();
  assert.equal(clears, 1);
  render();
  assert.equal(clears, 1);
});

test("cross-tab logout and history restoration hide account carts without deleting them or republishing stale data", () => {
  const cart = customerCartHarness(new Map([
    ["engineerparts.cart.v2.customer.123", JSON.stringify([cartLine])],
  ]));
  cart.render().selectCustomer(123);
  cart.render();
  const staleWrite = cart.h.effects[0];
  cart.h.effects.at(-1)();
  cart.storage.set("engineerparts.cart.customer", "null");
  staleWrite();
  cart.listeners.get("storage")({ key: "engineerparts.cart.customer", newValue: "null", storageArea: cart.localStorage });
  assert.equal(cart.render().items.length, 0);
  assert.equal(JSON.parse(cart.storage.get("engineerparts.cart.v2.customer.123"))[0].quantity, 2);
  cart.render().selectCustomer(123);
  cart.render();
  cart.h.effects.at(-1)();
  cart.storage.set("engineerparts.cart.customer", "null");
  cart.listeners.get("pageshow")({ persisted: true });
  assert.equal(cart.render().items.length, 0);
  assert.equal(cart.storage.get("engineerparts.cart.customer"), "null", "History restoration must not broadcast the old owner");
});

test("unreadable customer storage shows an error without overwriting the saved data", () => {
  const cart = customerCartHarness(new Map([
    ["engineerparts.cart.v2.customer.123", "invalid-json"],
  ]));
  cart.render().selectCustomer(123);
  assert.equal(cart.render().items.length, 0);
  cart.h.effects[0]();
  assert.equal(cart.storage.get("engineerparts.cart.v2.customer.123"), "invalid-json");
  assert.match(cart.notices[0], /Allow site storage and refresh/);
});

test("session refresh selects the authenticated customer's cart or the guest cart on session expiry", async () => {
  for (const status of [200, 401, 503]) {
    const h = hooks();
    const selected = [];
    const { AuthProvider } = load("components/providers/AuthProvider.tsx", {
      react: h.react,
      "next/navigation": { useRouter: () => ({}) },
      "@/components/providers/CartProvider": { useCart: () => ({ selectCustomer: (id) => selected.push(id) }) },
      "@/lib/leads": { readLeads: () => [] },
    }, { fetch: async () => ({ status, ok: status === 200, json: async () => ({ customer: { id: 123 } }) }) });
    await AuthProvider({ children: null }).props.value.refreshUser();
    assert.deepEqual(selected, [status === 200 ? 123 : null]);
    assert.equal(h.states[1], false);
  }
});

test("a session response started before logout cannot restore the old customer's cart", async () => {
  const h = hooks([{ id: 123 }, false]);
  const selected = [];
  let finish;
  const { AuthProvider } = load("components/providers/AuthProvider.tsx", {
    react: h.react,
    "next/navigation": { useRouter: () => ({ push() {}, refresh() {} }) },
    "@/components/providers/CartProvider": { useCart: () => ({ selectCustomer: (id) => selected.push(id) }) },
  }, { fetch: (url) => url === "/api/auth/me"
    ? new Promise((resolve) => { finish = resolve; })
    : Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) }) });
  const auth = AuthProvider({ children: null }).props.value;
  const pending = auth.refreshUser();
  await auth.logout();
  finish({ ok: true, status: 200, json: async () => ({ customer: { id: 123 } }) });
  await pending;
  assert.deepEqual(selected, [null]);
  assert.equal(h.states[0], null);
});

test("logout API removes the session cookie only after WordPress confirms success",async () => {
  for(const ok of [true,false]) {
    const deleted=[];
    const { POST }=load("app/api/auth/[action]/route.ts",{
      "@/lib/account": { SESSION_COOKIE: "engineerparts_session" },
      "@/lib/auth-server": { wordpressAccountRequest: async () => ({ status: ok? 200:503,data: { ok } }) },
      "@/lib/private-response": {
        privateJson: (body,status) => ({ body,status,cookies: { delete: (key) => deleted.push(key) } }),
      },
    });

    const request={
      headers: { get: () => null },cookies: { get: () => ({ value: "private" }) },json: async () => ({}),
    };
    const response=await POST(request,{ params: { action: "logout" } });
    assert.equal(response.status,ok? 200:503);
    assert.deepEqual(deleted,ok? ["engineerparts_session"]:[]);
  }
});

test("customer messages explain recovery without exposing raw server errors",() => {
  const { customerResponseMessage }=load("lib/customer-feedback.ts");
  assert.match(customerResponseMessage(401,{ code: "invalid_credentials" },"fallback"),/Forgot password/);
  assert.match(customerResponseMessage(401,{},"fallback"),/Sign in again/);
  assert.match(customerResponseMessage(403,{ code: "email_unverified" },"fallback"),/new link/);
  assert.match(customerResponseMessage(400,{ code: "invalid_verification" },"fallback"),/Resend verification/);
  assert.match(customerResponseMessage(400,{ code: "invalid_reset" },"fallback"),/Forgot password/);
  assert.match(customerResponseMessage(429,{},"fallback"),/Wait/);
  assert.match(customerResponseMessage(413,{},"fallback"),/Shorten/);
  assert.match(customerResponseMessage(422,{ code: "invalid_checkout_address" },"fallback"),/postal code/);
  assert.match(customerResponseMessage(502,{ code: "payment_gateway_failed" },"fallback"),/duplicate order/);
  assert.equal(customerResponseMessage(500,{ error: "SQL failure password=private",code: "unexpected" },"Safe fallback"),"Safe fallback");
  assert.doesNotMatch(customerResponseMessage(503,{ error: "Account registration verification is not configured." },"fallback"),/configured|SECRET|WordPress/);
});

test("field validation names the missing field and preserves valid initials and plus-addressed emails",() => {
  const { validateCustomerFields }=load("lib/customer-feedback.ts");
  assert.equal(validateCustomerFields([["Last name","S"],["Email","user+test@example.com","email"]]),null);
  assert.equal(validateCustomerFields([["Company name"," "]]),"Enter company name.");
  assert.equal(validateCustomerFields([["Message","123456",undefined,5]]),"Message must be 5 characters or fewer.");
  assert.match(validateCustomerFields([["Email","user@example","email"]]),/name@example.com/);
  assert.match(validateCustomerFields([["Phone","123","phone"]]),/country code/);
  assert.equal(validateCustomerFields([["Phone","+971 50 123 4567","phone"]]),null);
});

test("customer requests handle HTTP, non-JSON, malformed, logical and network failures with safe messages",async () => {
  for(const outcome of ["success","http","html","array","logical","missing-ok","network"]) {
    const logs=[];
    const feedback=load("lib/customer-feedback.ts",{
      "@/lib/logger": { logError: (...args) => logs.push(args) },
    },{
      fetch: async () => {
        if(outcome==="network") throw new TypeError("Failed to fetch");
        return {
          ok: outcome!=="http",status: outcome==="http"? 503:200,
          json: async () => {
            if(outcome==="html") throw new SyntaxError("Unexpected token '<'");
            if(outcome==="array") return [];
            if(outcome==="missing-ok") return {};
            return { ok: outcome!=="logical",error: "internal secret config",value: 123 };
          },
        };
      },
    });
    if(outcome==="success") {
      assert.equal((await feedback.customerRequest("/api/example",{},"Try again later.")).value,123);
      assert.equal(logs.length,0);
    } else {
      await assert.rejects(feedback.customerRequest("/api/example",{},"Try again later."),(error) => {
        assert.doesNotMatch(error.message,/internal secret|Unexpected token|Failed to fetch/);
        assert.match(error.message,outcome==="network"? /internet connection/:/Try again later/);
        return true;
      });
      assert.equal(logs.length,1);
    }
  }
});

test("aborted customer requests do not create visible connection errors",async () => {
  const aborted=new DOMException("Aborted","AbortError");
  const { customerRequest }=load("lib/customer-feedback.ts",{},{ fetch: async () => { throw aborted; } });
  await assert.rejects(customerRequest("/api/example",{},"fallback"),(error) => error===aborted);
});

test("contact form reports the exact missing field before sending a request",async () => {
  const h=hooks([{ name: "Sam",company: "",email: "user@example.com",phone: "+971501234567",message: "Help" }]);
  let submitted=false;
  const { ContactForm }=load("components/forms/ContactForm.tsx",{
    react: h.react,"@/lib/leads": { submitLead: async () => { submitted=true; } },
  });
  await ContactForm().props.onSubmit({ preventDefault() { } });
  assert.equal(h.states[2],"Enter company name.");
  assert.equal(submitted,false);
});

test("saved-product load failure is visible and does not erase browser data or report an empty successful list",async () => {
  const h=hooks();
  const notices=[];
  let removed=false;
  const { SavedProductsProvider }=load("components/providers/SavedProductsProvider.tsx",{
    react: h.react,
    "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: true,loading: false }) },
    "@/components/providers/ToastProvider": { useToast: () => ({ toast: (message) => notices.push(message) }) },
  },{
    window: { localStorage: { getItem: () => '["1"]',removeItem: () => { removed=true; } } },
    fetch: async () => ({ ok: false,status: 503,json: async () => ({ error: "internal config detail" }) }),
  });
  SavedProductsProvider({ children: null });
  h.effects[0]();
  await new Promise(setImmediate);
  assert.equal(removed,false);
  assert.equal(h.states[1],false);
  assert.match(notices[0],/Refresh/);
  assert.doesNotMatch(notices[0],/internal config/);
});

test("partially failed saved-product merge retains the browser copy and reports failure",async () => {
  const h=hooks();
  const notices=[];
  let removed=false;
  const { SavedProductsProvider }=load("components/providers/SavedProductsProvider.tsx",{
    react: h.react,
    "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: true,loading: false }) },
    "@/components/providers/ToastProvider": { useToast: () => ({ toast: (message) => notices.push(message) }) },
  },{
    window: { localStorage: { getItem: () => '["1","2"]',removeItem: () => { removed=true; } } },
    fetch: async (_url,init) => {
      const failed=init.method==="POST"&&JSON.parse(init.body).productId==="2";
      return { ok: !failed,status: failed? 503:200,json: async () => ({ productIds: [],ok: !failed }) };
    },
  });
  SavedProductsProvider({ children: null });
  h.effects[0]();
  await new Promise(setImmediate);
  assert.equal(removed,false);
  assert.equal(h.states[0].has("1"),true);
  assert.equal(h.states[0].has("2"),false);
  assert.equal(h.states[1],true);
  assert.match(notices[0],/browser copy has been kept/);
});

test("blocked saved-product storage rejects rather than displaying false success",async () => {
  const h=hooks([new Set(),true]);
  const { SavedProductsProvider }=load("components/providers/SavedProductsProvider.tsx",{
    react: h.react,
    "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: false,loading: false }) },
  },{
    window: { localStorage: { setItem() { throw new Error("Blocked"); } } },
  });
  const tree=SavedProductsProvider({ children: null });
  await assert.rejects(tree.props.value.toggle("1"),/Allow site storage/);
  assert.equal(h.states[0].size,0);
});

test("empty inventory download gives recovery instructions instead of reporting success",() => {
  const { downloadCsv }=load("lib/download.ts");
  assert.throws(() => downloadCsv("inventory.csv",[],{ reference: "LOT-1",source: "test" }),/Contact sales/);
});

test("account field markers follow input required flags, including wrapped password inputs", () => {
  for (const file of ["components/account/AuthForms.tsx", "components/account/AccountForms.tsx"]) {
    const h = hooks();
    const { Field, PasswordInput } = load(file, { react: h.react }, {}, "\nexport { Field };"
      + (file.endsWith("AuthForms.tsx") ? "\nexport { PasswordInput };" : ""));
    for (const required of [true, false]) {
      const field = Field({ label: "Example", htmlFor: "example", children: { type: "input", props: { required } } });
      assert.equal(Boolean(find(field, (node) => node.type === "span" && node.props.children === " *")), required);
    }
    if (PasswordInput) {
      const field = Field({ label: "Password", htmlFor: "password", children: { type: PasswordInput, props: {} } });
      assert.ok(find(field, (node) => node.type === "span" && node.props.children === " *"));
      assert.equal(find(PasswordInput({ id: "password" }), (node) => node.type === "input").props.required, true);
    }
  }
});

test("checkout marks policy consent as required and applies required semantics to contact fields", () => {
  const h = hooks();
  const { CheckoutForm } = load("components/cart/CheckoutForm.tsx", {
    react: h.react,
    "@/components/providers/CartProvider": { useCart: () => ({ ready: true, items: [{ productId: "1" }] }) },
    "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: false }) },
  });
  const tree = CheckoutForm({ countries: [] });
  for (const autoComplete of ["given-name", "family-name", "email", "tel"]) {
    assert.equal(find(tree, (node) => node.type === "input" && node.props.autoComplete === autoComplete).props.required, true);
  }
  const review = hooks([undefined, 3]);
  // Use the form's default state, changing only the active step.
  delete review.states[0];
  const reviewForm = load("components/cart/CheckoutForm.tsx", {
    react: review.react,
    "@/components/providers/CartProvider": { useCart: () => ({ ready: true, items: [{ productId: "1" }] }) },
    "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: false }) },
  }).CheckoutForm({ countries: [] });
  assert.equal(find(reviewForm, (node) => node.type === "input" && node.props.type === "checkbox" && node.props.required).props.required, true);
});

test("order validation accepts UAE COD, rejects overseas COD and unknown methods, and preserves online payment", () => {
  const { validPayload } = load("app/api/orders/route.ts", {}, {}, "\nexport { validPayload };");
  const payload = {
    order_id: "ORD-test123", customer: { billing: { ...address, email: "user@example.com", phone: "+971501234567" } },
    items: [{ productId: "1", quantity: 1 }], acceptPolicies: true,
  };
  assert.equal(validPayload({ ...payload, paymentMethod: "cod" }), true);
  assert.equal(validPayload({ ...payload, paymentMethod: "unknown" }), false);
  assert.equal(validPayload({ ...payload, paymentMethod: "cod", customer: { ...payload.customer, shipping: { ...address, country: "GB" } } }), false);
  assert.equal(validPayload({ ...payload, paymentMethod: "nomod", customer: { ...payload.customer, shipping: { ...address, country: "GB" } } }), true);
  assert.equal(validPayload(payload), true);
});

function wooModule(fetch) {
  return load("lib/woocommerce.ts", {
    "server-only": {},
    "next/cache": { unstable_cache: (fn) => fn },
  }, {
    fetch,
    process: { env: { WOOCOMMERCE_URL: "https://store.example.com", WOOCOMMERCE_CONSUMER_KEY: "test-key", WOOCOMMERCE_CONSUMER_SECRET: "test-secret", ENGINEERPARTS_PROXY_SECRET: "x".repeat(32) } },
  });
}

test("cart quotes use discounted subtotal and real WooCommerce free delivery, with AED 200 inclusive", async () => {
  for (const subtotal of [199.99, 200, 200.01]) {
    const shipping = subtotal >= 200 ? 0 : 25;
    const tax = subtotal * 0.05 + shipping * 0.05;
    const cart = {
      totals: {
        total_items: "25000", total_discount: String(Math.round((250 - subtotal) * 100)),
        total_shipping: String(shipping * 100), total_shipping_tax: String(shipping * 5),
        total_tax: String(Math.round(tax * 100)), total_price: String(Math.round((subtotal + shipping + tax) * 100)),
        currency_code: "AED", currency_minor_unit: 2,
      },
      shipping_rates: [{ package_id: 0, shipping_rates: [{ rate_id: "flat_rate:1", method_id: "flat_rate", name: shipping === 0 ? "Free delivery" : "Delivery", selected: true, price: String(shipping * 100) }] }],
    };
    const { getWooCommerceCartQuote } = wooModule(async (url) => ({
      ok: true, headers: { get: () => "cart-token" },
      json: async () => String(url).includes("/wc/v3/products")
        ? [{ id: 1, stock_quantity: 10, stock_status: "instock" }] : cart,
    }));
    const quote = await getWooCommerceCartQuote([{ productId: "1", quantity: 1 }], "GB");
    assert.ok(Math.abs(quote.subtotal - subtotal) < 0.001);
    assert.equal(quote.shipping, shipping);
    assert.ok(Math.abs(quote.freeShippingRemaining - Math.max(0, 200 - subtotal)) < 0.001);
    assert.equal(quote.total, Number(cart.totals.total_price) / 100);
    assert.equal(quote.tax, Number(cart.totals.total_tax) / 100);
  }
});

test("COD checkout forwards the selected gateway and builds a local confirmation, while online redirects remain guarded", async () => {
  for (const paymentMethod of ["nomod", "cod"]) {
    let forwarded;
    const cart = { shipping_rates: [] };
    const { submitWooCommerceCheckout } = wooModule(async (url, init) => {
      if (String(url).includes("/orders/checkout")) {
        forwarded = JSON.parse(init.body);
        return {
          ok: true, json: async () => ({
            ok: true, checkout: {
              order_id: 42, order_key: "wc_order_test12345642", status: "processing",
              payment_result: { payment_status: "success", redirect_url: "https://store.example.com/checkout/order-received/42" },
            },
          }),
        };
      }
      return { ok: true, headers: { get: () => "valid-header" }, json: async () => cart, text: async () => JSON.stringify(cart) };
    });
    const result = await submitWooCommerceCheckout({
      items: [{ productId: "1", quantity: 1 }], billing: {}, shipping: {},
      customerNote: "", idempotencyKey: "ORD-test123", requestHash: "a".repeat(64), paymentMethod,
    });
    assert.equal(forwarded.checkout.payment_method, paymentMethod);
    assert.equal(result.payment_result.redirect_url, paymentMethod === "cod"
      ? "/checkout/success?order_id=42&order_key=wc_order_test12345642" : "");
  }
});

test("COD confirmation treats accepted unpaid delivery orders as confirmed, not pending online payments", () => {
  const { deriveState } = load("components/checkout/OrderSuccessView.tsx", { react: hooks().react }, {}, "\nexport { deriveState };");
  assert.equal(deriveState("on-hold", "cod"), "confirmed");
  assert.equal(deriveState("processing", "cod"), "confirmed");
  assert.equal(deriveState("on-hold", "nomod"), "confirming");
  assert.equal(deriveState("failed", "cod"), "failed");
  assert.equal(deriveState("cancelled", "cod"), "failed");
  assert.equal(deriveState("pending", "cod"), "confirming");
});

test("checkout offers COD only for the actual UAE delivery destination and falls back to online otherwise", () => {
  for (const country of ["AE", "GB"]) {
    const form = {
      billing: { ...address, email: "user@example.com", phone: "+971501234567" },
      shipping: { ...address, country }, sameAsBilling: false,
    };
    const h = hooks([form, 3, "individual", "cod"]);
    const { CheckoutForm } = load("components/cart/CheckoutForm.tsx", {
      react: h.react,
      "@/components/providers/CartProvider": { useCart: () => ({ ready: true, items: [{ productId: "1" }] }) },
      "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: false }) },
    });
    const tree = CheckoutForm({ countries: [] });
    const cod = find(tree, (node) => node.type === "input" && node.props.value === "cod");
    const online = find(tree, (node) => node.type === "input" && node.props.value === "nomod");
    assert.equal(Boolean(cod), country === "AE");
    assert.equal(online.props.checked, country !== "AE");
    if (cod) assert.equal(cod.props.checked, true);
  }
});

test("checkout submission shows the selected payment flow and navigates to its confirmation or payment URL", async () => {
  for (const paymentMethod of ["cod", "nomod"]) {
    const form = {
      billing: { ...address, email: "user@example.com", phone: "+971501234567" },
      shipping: address, sameAsBilling: true, acceptPolicies: true,
      trn: "", customerNote: "",
    };
    const h = hooks([form, 3, "individual", paymentMethod]);
    let finish;
    let submitted;
    let destination;
    const url = paymentMethod === "cod"
      ? "/checkout/success?order_id=42&order_key=wc_order_test12345642"
      : "https://pay.nomod.com/test";
    const mocks = {
      "@/components/providers/CartProvider": { useCart: () => ({
        ready: true, items: [{ productId: "1", quantity: 1 }], stockValid: true, total: 210,
      }) },
      "@/components/providers/AuthProvider": { useAuth: () => ({ authenticated: false }) },
      "@/lib/analytics": { track() {} },
    };
    const globals = {
      fetch: async (_url, init) => {
        submitted = JSON.parse(init.body);
        return new Promise((resolve) => { finish = resolve; });
      },
      sessionStorage: { getItem: () => null, setItem() {} },
      window: { crypto: { randomUUID: () => "test123" }, location: { assign: (value) => { destination = value; } } },
    };
    const render = (react) => load("components/cart/CheckoutForm.tsx", { ...mocks, react }, globals).CheckoutForm({ countries: [] });
    const tree = render(h.react);
    const submission = tree.props.onSubmit({ preventDefault() {} });
    assert.equal(submitted.paymentMethod, paymentMethod);
    assert.equal(h.states[4], "submitting");
    const pending = render(hooks(h.states).react);
    const heading = find(pending, (node) => node.type === "h1").props.children;
    const message = find(pending, (node) => node.type === "p").props.children;
    assert.equal(heading, paymentMethod === "cod" ? "Placing your Cash on Delivery order" : "Preparing your secure payment");
    if (paymentMethod === "cod") {
      assert.match(message, /order confirmation/);
      assert.match(message, /Pay cash/);
      assert.doesNotMatch(message, /Nomod|redirect|secure payment/i);
    } else {
      assert.match(message, /redirect you to Nomod/);
    }
    finish({ ok: true, json: async () => ({ payment_url: url }) });
    await submission;
    assert.equal(destination, url);
  }
});

test("email payment page does not start payment on GET and blocks invalid, paid and COD orders", async () => {
  for (const kind of ["invalid", "paid", "on-hold", "cod", "unpaid"]) {
    let payments = 0;
    let lookups = 0;
    const { default: Page } = load("app/checkout/pay/page.tsx", {
      "@/lib/woocommerce": {
        isValidWooCommerceOrderKey: () => kind !== "invalid",
        getWooCommerceOrderIfKeyMatches: async () => {
          lookups += 1;
          return { number: "42", status: kind === "paid" ? "processing" : kind === "on-hold" ? "on-hold" : "pending", payment_method: kind === "cod" ? "cod" : "nomod" };
        },
      },
      "@/lib/auth-server": { wordpressAccountRequest: async () => { payments += 1; } },
    });
    const tree = await Page({ searchParams: { order_id: "42", order_key: "wc_order_test12345642" } });
    const form = find(tree, (node) => node.type === "form");
    assert.equal(Boolean(form), kind === "unpaid");
    assert.equal(payments, 0, "Opening/scanning an email link must never create a payment session");
    assert.equal(lookups, kind === "invalid" ? 0 : 1);
  }
});

test("email payment submission rechecks ownership/status and rejects unsafe gateway redirects", async () => {
  for (const kind of ["valid", "paid-before-submit", "invalid-key-before-submit", "backend", "http", "credentials", "failure"]) {
    let lookups = 0;
    let payments = 0;
    const target = kind === "backend" ? "https://shop.engineerparts.com/checkout"
      : kind === "http" ? "http://pay.nomod.com/test"
      : kind === "credentials" ? "https://user:password@pay.nomod.com/test"
      : "https://pay.nomod.com/test";
    const { default: Page } = load("app/checkout/pay/page.tsx", {
      "next/navigation": { redirect: (url) => { throw new Error(`REDIRECT:${url}`); } },
      "@/lib/woocommerce": {
        isValidWooCommerceOrderKey: () => true,
        getWooCommerceOrderIfKeyMatches: async () => {
          lookups += 1;
          if (lookups > 1 && kind === "invalid-key-before-submit") return null;
          return { number: "42", status: lookups > 1 && kind === "paid-before-submit" ? "processing" : "pending", payment_method: "nomod" };
        },
      },
      "@/lib/auth-server": { wordpressAccountRequest: async (path, options) => {
        payments += 1;
        assert.equal(path, "orders/42/payment-link");
        assert.equal(options.method, "POST");
        return { status: kind === "failure" ? 503 : 200, data: { ok: kind !== "failure", paymentUrl: target } };
      } },
    });
    const tree = await Page({ searchParams: { order_id: "42", order_key: "wc_order_test12345642" } });
    const form = find(tree, (node) => node.type === "form");
    const closed = ["paid-before-submit", "invalid-key-before-submit"].includes(kind);
    await assert.rejects(form.props.action, (error) => {
      if (kind === "valid") assert.equal(error.message, "REDIRECT:https://pay.nomod.com/test");
      else if (closed) assert.match(error.message, /REDIRECT:\/checkout\/success\?/);
      else assert.match(error.message, /REDIRECT:\/checkout\/pay\?.*&error=unavailable/);
      return true;
    });
    assert.equal(payments, closed ? 0 : 1);
    assert.equal(lookups, 2);
  }
});

test("cart quotes select an available free rate before returning payable totals", async () => {
  let selected = false;
  const cart = (free) => ({
    totals: { total_items: "20000", total_discount: "0", total_shipping: free ? "0" : "2500", total_tax: "1000", total_price: free ? "21000" : "23500", currency_code: "AED", currency_minor_unit: 2 },
    shipping_rates: [{ package_id: 0, shipping_rates: [
      { rate_id: "flat_rate:1", method_id: "flat_rate", name: "Delivery", selected: !free, price: "2500" },
      { rate_id: "free_shipping:2", method_id: "free_shipping", name: "Free delivery", selected: free, price: "0" },
    ] }],
  });
  const { getWooCommerceCartQuote } = wooModule(async (url, init) => {
    if (String(url).includes("/select-shipping-rate")) {
      assert.equal(JSON.parse(init.body).rate_id, "free_shipping:2");
      selected = true;
    }
    return {
      ok: true, headers: { get: () => "cart-token" },
      json: async () => String(url).includes("/wc/v3/products") ? [{ id: 1, stock_quantity: 10, stock_status: "instock" }] : cart(selected),
    };
  });
  const quote = await getWooCommerceCartQuote([{ productId: "1", quantity: 1 }], "AE");
  assert.equal(selected, true);
  assert.equal(quote.shipping, 0);
  assert.equal(quote.total, 210);
  assert.equal(quote.shippingLabel, "Free delivery");
});
