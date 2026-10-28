import { logError } from "@/lib/logger";
import { isValidInternationalPhone } from "@/lib/utils";

const CODE_MESSAGES: Record<string, string> = {
  cod_unavailable: "Cash on Delivery is temporarily unavailable. Choose online payment, or contact sales for help.",
  cod_country_not_supported: "Cash on Delivery is available for UAE delivery addresses only. Choose online payment for this destination.",
  invalid_credentials: "The email or password is incorrect. Check both, or use Forgot password to reset your password.",
  email_exists: "This email address is already in use. Sign in, reset your password, or use a different email address.",
  email_unverified: "Verify your email before signing in. Open the latest verification email, or request a new link on the verification page.",
  invalid_verification: "This verification link is invalid or has expired. Select Resend verification and open the newest email.",
  invalid_reset: "This password reset link is invalid or has expired. Go to Forgot password and request a new link.",
  invalid_password: "Your current password is incorrect. Re-enter it, or use Forgot password to reset it.",
  unauthenticated: "Your session has expired. Sign in again, then retry this action.",
  captcha_required: "Complete the CAPTCHA verification, then submit the form again.",
  captcha_failed: "CAPTCHA verification failed or expired. Complete it again, then resubmit.",
  insufficient_stock: "The requested quantity is no longer available. Review the updated stock and reduce the quantity or remove the item.",
  shipping_option_required: "Delivery is not available for the selected address. Check the country and delivery address, or contact sales for delivery options.",
  invalid_checkout_address: "Check your billing and delivery address, including country, state/province, postal code and international phone number.",
  checkout_request_busy: "Your checkout is still processing. Wait a moment and retry without changing your order details.",
  checkout_attempt_closed: "This payment attempt has ended. Submit checkout again to start a new attempt.",
  checkout_request_conflict: "An order already exists for this checkout. Check your orders or contact support before changing the details or ordering again.",
  payment_handoff_failed: "Your order may already exist, but payment could not be opened. Check your orders or contact support before placing another order.",
  payment_gateway_failed: "Payment could not be started. Check your orders or contact support before retrying to avoid placing a duplicate order.",
  checkout_proxy_not_deployed: "Checkout is temporarily unavailable. Contact sales for help placing your order.",
};

const SAFE_MESSAGES: Record<string, string> = {
  "Incorrect email or password.": CODE_MESSAGES.invalid_credentials,
  "Current password is incorrect.": CODE_MESSAGES.invalid_password,
  "Invalid verification request.": CODE_MESSAGES.invalid_verification,
  "This verification link is invalid or has expired.": CODE_MESSAGES.invalid_verification,
  "Invalid password reset request.": CODE_MESSAGES.invalid_reset,
  "Password must be at least 8 characters and contain letters and numbers.": "Use at least 8 characters, including both letters and numbers.",
  "Please enter a valid email address.": "Enter a valid email address, such as name@example.com.",
  "Account registration verification is not configured.": "Account registration is temporarily unavailable. Please contact support or try again later.",
  "Product not found.": "This product is no longer available. Refresh the page or choose another product.",
  "Order not found.": "This order is unavailable. Open it from your account order history, or contact support with your order number.",
  "Please check the required profile fields.": "Check your first name, last name and email address. Names cannot be blank, and the email must be valid.",
  "Please complete all required address fields.": "Complete the first name, last name, street address, city and country for each address, plus email and phone for billing.",
  "Unable to verify CAPTCHA right now. Please try again.": "CAPTCHA could not be checked. Refresh the page and complete it again, or try later if it still fails.",
};

export function customerResponseMessage(status: number, data: unknown, fallback: string): string {
  const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
  if (typeof body.code === "string" && typeof CODE_MESSAGES[body.code] === "string") return CODE_MESSAGES[body.code];
  if (status === 429) return "Too many attempts. Wait before trying again; repeatedly submitting may extend the wait. Contact support if it continues.";
  if (status === 401) return CODE_MESSAGES.unauthenticated;
  if (status === 413) return "Your submission is too long. Shorten the message and other text fields, then try again.";
  if (typeof body.error === "string" && typeof SAFE_MESSAGES[body.error] === "string") return SAFE_MESSAGES[body.error];
  if (status === 403) return "This action could not be authorized. Refresh the page, sign in if needed, and try again.";
  if (status === 409) return "This information conflicts with an existing record. Refresh the page and review your latest details before trying again.";
  return fallback;
}

export class CustomerError extends Error {}

export function customerErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof CustomerError) return error.message;
  if (error instanceof TypeError) return "We could not connect to the store. Check your internet connection and try again. If you already submitted an order, check its status before retrying.";
  return fallback;
}

export async function customerRequest<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    logError("customer.request_connection_failed", { endpoint: url.split("?")[0], error });
    throw new CustomerError(customerErrorMessage(error, fallback));
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    logError("customer.request_invalid_response", { endpoint: url.split("?")[0], status: response.status, error });
    throw new CustomerError(customerResponseMessage(response.status, null, fallback));
  }
  if (!response.ok || !data || typeof data !== "object" || Array.isArray(data) || !("ok" in data) || data.ok !== true) {
    logError("customer.request_rejected", { endpoint: url.split("?")[0], status: response.status });
    throw new CustomerError(customerResponseMessage(response.status, data, fallback));
  }
  return data as T;
}

type Field = readonly [label: string, value: unknown, kind?: "email" | "phone", maxLength?: number];

export function validateCustomerFields(fields: readonly Field[]): string | null {
  for (const [label, value, kind, maxLength] of fields) {
    if (typeof value !== "string" || !value.trim()) return `Enter ${label.toLowerCase()}.`;
    if (maxLength && value.trim().length > maxLength) return `${label} must be ${maxLength} characters or fewer.`;
    if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address, such as name@example.com.";
    if (kind === "phone" && !isValidInternationalPhone(value)) return "Enter a valid phone number with its country code, such as +971501234567.";
  }
  return null;
}
