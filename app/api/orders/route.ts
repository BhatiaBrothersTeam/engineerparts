import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getWooCommerceCartQuote,
  submitWooCommerceCheckout,
  updateWooCommerceOrder,
  WooCommerceStoreApiError,
} from "@/lib/woocommerce";
import { getCurrentCustomer } from "@/lib/auth-server";
import { wordpressAccountRequest } from "@/lib/auth-server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/account";
import { isPlausibleAddress, isValidInternationalPhone } from "@/lib/utils";
import { logError, redact } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVENTORY_ERROR_CODES = new Set([
  "insufficient_stock",
  "woocommerce_rest_product_partially_out_of_stock",
  "woocommerce_rest_product_out_of_stock",
  "woocommerce_rest_product_not_purchasable",
  "woocommerce_rest_product_too_many_in_cart",
]);

interface OrderPayload {
  order_id: string;
  customer: {
    billing: CustomerAddress & { email: string; phone: string };
    shipping?: CustomerAddress;
  };
  items: Array<{ productId: string; quantity: number }>;
  saveAddress?: boolean;
  acceptPolicies: true;
  trn?: string;
  customer_note?: string;
}

interface CustomerAddress {
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
}

function validPayload(value: unknown): value is OrderPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<OrderPayload>;
  const customer = payload.customer;
  const billing = customer?.billing;
  return Boolean(
    typeof payload.order_id === "string" &&
      /^[A-Za-z0-9_-]{8,80}$/.test(payload.order_id.trim()) &&
      billing &&
      validAddress(billing) &&
      typeof billing.email === "string" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email.trim()) &&
      typeof billing.phone === "string" &&
      isValidInternationalPhone(billing.phone) &&
      payload.acceptPolicies === true &&
      Array.isArray(payload.items) &&
      payload.items.length > 0 &&
      payload.items.length <= 50 &&
      payload.items.every(
        (item) => Boolean(
          item &&
            typeof item === "object" &&
            Number.isSafeInteger(Number(item.productId)) &&
            Number(item.productId) > 0 &&
            Number.isSafeInteger(item.quantity) &&
            item.quantity > 0,
        ),
      ) &&
      (payload.trn === undefined || (typeof payload.trn === "string" && payload.trn.length <= 50)) &&
      (payload.customer_note === undefined ||
        (typeof payload.customer_note === "string" && payload.customer_note.length <= 2000)) &&
      (customer?.shipping === undefined || validAddress(customer.shipping)),
  );
}

function validAddress(value: unknown): value is CustomerAddress {
  if (!value || typeof value !== "object") return false;
  const address = value as Partial<CustomerAddress>;
  return Boolean(
    typeof address.firstName === "string" &&
      address.firstName.trim().length >= 2 &&
      typeof address.lastName === "string" &&
      address.lastName.trim().length >= 2 &&
      typeof address.company === "string" &&
      typeof address.address1 === "string" &&
      isPlausibleAddress(address.address1) &&
      typeof address.address2 === "string" &&
      typeof address.city === "string" &&
      address.city.trim().length >= 2 &&
      typeof address.state === "string" &&
      typeof address.postalCode === "string" &&
      typeof address.country === "string" &&
      /^[A-Z]{2}$/.test(address.country),
  );
}

function wooAddress(address: CustomerAddress) {
  return {
    first_name: address.firstName.trim(),
    last_name: address.lastName.trim(),
    company: address.company.trim(),
    address_1: address.address1.trim(),
    address_2: address.address2.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postcode: address.postalCode.trim(),
    country: address.country,
  };
}

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 65_536) {
    return NextResponse.json({ ok: false, error: "Request is too large." }, { status: 413 });
  }
  try {
    const payload: unknown = await request.json();
    if (!validPayload(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid order details" }, { status: 400 });
    }

    const billingAddress = {
      ...wooAddress(payload.customer.billing),
      email: payload.customer.billing.email.trim(),
      phone: payload.customer.billing.phone.trim(),
    };
    const shippingAddress = {
      ...wooAddress(payload.customer.shipping ?? payload.customer.billing),
      phone: billingAddress.phone,
    };
    const customer = await getCurrentCustomer();
    const sessionToken = cookies().get(SESSION_COOKIE)?.value;
    const quantities = new Map<string, number>();
    for (const item of payload.items) {
      const productId = String(Number(item.productId));
      const quantity = (quantities.get(productId) ?? 0) + item.quantity;
      if (!Number.isSafeInteger(quantity)) {
        return NextResponse.json({ ok: false, error: "Invalid order quantities." }, { status: 400 });
      }
      quantities.set(productId, quantity);
    }
    const items = [...quantities]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([productId, quantity]) => ({ productId, quantity }));
    const quote = await getWooCommerceCartQuote(
      items,
      payload.customer.shipping?.country ?? payload.customer.billing.country,
    );
    const unavailable = items
      .map((item) => {
        const stock = quote.stockLimits.find(({ productId }) => productId === item.productId);
        return { ...item, maxQuantity: stock ? stock.maxQuantity : 0 };
      })
      .find((item) => item.maxQuantity !== null && item.quantity > item.maxQuantity);
    if (unavailable) {
      logError("woocommerce_inventory_conflict", {
        endpoint: "/api/orders",
        product_id: unavailable.productId,
        requested_quantity: unavailable.quantity,
        available_quantity: unavailable.maxQuantity,
      });
      return NextResponse.json(
        { ok: false, code: "insufficient_stock", error: unavailable.maxQuantity === 0
          ? "This product is out of stock. Please update your cart."
          : `Only ${unavailable.maxQuantity} of this product are currently in stock. Please update your cart.` },
        { status: 409 },
      );
    }
    const policyAcceptedAt = new Date().toISOString();
    const customerNote = [
      payload.customer_note?.trim(),
      payload.trn?.trim() ? `TRN: ${payload.trn.trim()}` : "",
      `Storefront reference: ${payload.order_id}`,
      `Terms and privacy accepted: ${policyAcceptedAt}`,
    ]
      .filter(Boolean)
      .join("\n");
    const requestHash = createHash("sha256")
      .update(JSON.stringify({
        items,
        billing: billingAddress,
        shipping: shippingAddress,
        customerNote: payload.customer_note?.trim() ?? "",
        trn: payload.trn?.trim() ?? "",
        saveAddress: Boolean(payload.saveAddress),
      }))
      .digest("hex");
    const checkout = await submitWooCommerceCheckout({
      items,
      billing: billingAddress,
      shipping: shippingAddress,
      customerNote,
      idempotencyKey: payload.order_id.trim(),
      requestHash,
    });
    const paymentUrl = checkout.payment_result.redirect_url;

    if (!paymentUrl) {
      logError("store_api_payment_redirect_missing", {
        endpoint: "/api/orders",
        order_id: checkout.order_id,
      });
      return NextResponse.json(
        {
          ok: false,
          code: "payment_handoff_failed",
          error: `Your order (${checkout.order_id}) was created, but secure payment could not be started. Please contact support before placing another order.`,
        },
        { status: 502 },
      );
    }
    let orderNumber = String(checkout.order_id);
    try {
      const order = await updateWooCommerceOrder(checkout.order_id, {
        customer_id: customer?.id,
        meta_data: [
          { key: "storefront_reference", value: payload.order_id },
          { key: "storefront_terms_accepted", value: policyAcceptedAt },
          { key: "storefront_privacy_acknowledged", value: policyAcceptedAt },
        ],
      });
      orderNumber = order.number || orderNumber;
    } catch (error) {
      logError("storefront_order_metadata_update_failed", {
        endpoint: "/api/orders",
        order_id: checkout.order_id,
        error,
      });
    }
    if (customer && payload.saveAddress) {
      if (sessionToken) {
        await wordpressAccountRequest("account/addresses", {
          method: "PUT",
          token: sessionToken,
          body: {
            billing: payload.customer.billing,
            shipping: payload.customer.shipping ?? payload.customer.billing,
            sameAsBilling: !payload.customer.shipping,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      order_id: checkout.order_id,
      order_number: orderNumber,
      payment_url: paymentUrl,
    });
  } catch (error) {
    if (
      error instanceof WooCommerceStoreApiError &&
      error.path === "/checkout" &&
      error.code === "rest_no_route"
    ) {
      logError("woocommerce_checkout_proxy_missing", {
        endpoint: "/api/orders",
        wordpress_status: error.status,
      });
      return NextResponse.json(
        {
          ok: false,
          code: "checkout_proxy_not_deployed",
          error: "The WordPress checkout endpoint is not active. Deploy and activate the latest EngineerParts Customer Accounts plugin on the configured WordPress site, then try again. No order was created.",
        },
        { status: 503 },
      );
    }
    if (
      error instanceof WooCommerceStoreApiError &&
      error.path === "/checkout" &&
      error.code === "woocommerce_rest_cart_empty"
    ) {
      logError("woocommerce_checkout_cart_empty", {
        endpoint: "/api/orders",
        wordpress_status: error.status,
      });
      return NextResponse.json(
        {
          ok: false,
          code: "checkout_cart_empty",
          error: "Your checkout cart expired before the order was created. Please return to your cart and try again. If this keeps happening, update the EngineerParts WordPress plugin.",
        },
        { status: 409 },
      );
    }
    if (error instanceof WooCommerceStoreApiError && INVENTORY_ERROR_CODES.has(error.code)) {
      logError("woocommerce_inventory_conflict", {
        endpoint: "/api/orders",
        path: error.path,
        code: error.code,
        status: error.status,
      });
      return NextResponse.json(
        {
          ok: false,
          code: "insufficient_stock",
          error: "Sorry, this product is no longer available in the requested quantity. Please update your cart and try again.",
        },
        { status: 409 },
      );
    }
    if (
      error instanceof WooCommerceStoreApiError &&
      (error.code === "checkout_attempt_closed" || error.code === "checkout_request_conflict")
    ) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message },
        { status: 409 },
      );
    }
    if (error instanceof WooCommerceStoreApiError && error.code === "woocommerce_rest_guest_checkout_disabled") {
      return NextResponse.json(
        {
          ok: false,
          code: "guest_checkout_disabled",
          error: "WooCommerce guest checkout is disabled. The storefront account login does not create a WordPress login session. Enable guest checkout in WooCommerce → Settings → Accounts & Privacy; the order will still be linked to your customer account.",
        },
        { status: 409 },
      );
    }
    if (
      error instanceof WooCommerceStoreApiError &&
      error.code === "woocommerce_rest_invalid_shipping_option"
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "shipping_option_required",
          error: "WooCommerce could not select a shipping method for this address. Check the shipping methods in WooCommerce → Settings → Shipping, then try again.",
        },
        { status: 409 },
      );
    }
    if (
      error instanceof WooCommerceStoreApiError &&
      error.code === "woocommerce_rest_checkout_process_payment_error"
    ) {
      logError("woocommerce_payment_gateway_failed", {
        endpoint: "/api/orders",
        path: error.path,
        code: error.code,
        status: error.status,
        gateway_message: redact(error.message),
      });
      return NextResponse.json(
        {
          ok: false,
          code: "payment_gateway_failed",
          error: "Nomod could not start the payment. WooCommerce may have created an unpaid order, so check WooCommerce → Orders before retrying. If there is no order, check WooCommerce → Status → Logs for the Nomod gateway error.",
        },
        { status: 502 },
      );
    }
    if (
      error instanceof WooCommerceStoreApiError &&
      error.path === "/cart/update-customer" &&
      error.code === "rest_invalid_param"
    ) {
      logError("woocommerce_address_validation_failed", {
        endpoint: "/api/orders",
        invalidParams: error.invalidParams,
        invalidAddressFields: error.invalidAddressFields,
      });
      const fields = error.invalidAddressFields.length
        ? ` Check these address fields: ${error.invalidAddressFields.join(", ")}.`
        : " Check the country, state/province, postal code, and phone formats for the selected country.";
      return NextResponse.json(
        {
          ok: false,
          code: "invalid_checkout_address",
          error: `WooCommerce rejected the billing or delivery address.${fields}`,
        },
        { status: 422 },
      );
    }
    logError("woocommerce_order_failed", {
      endpoint: "/api/orders",
      error: error instanceof WooCommerceStoreApiError
        ? {
            name: error.name,
            path: error.path,
            code: error.code,
            status: error.status,
            invalidParams: error.invalidParams,
            invalidAddressFields: error.invalidAddressFields,
          }
        : error,
    });
    return NextResponse.json(
      { ok: false, error: "We could not submit your order. Please try again or contact our sales team." },
      { status: 502 },
    );
  }
}
