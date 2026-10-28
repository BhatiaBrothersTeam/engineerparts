# EngineerParts Customer Accounts

This plugin provides the restricted WordPress endpoints used by the EngineerParts Next.js account system. WooCommerce customers remain the source of truth for profiles, addresses, passwords, and orders.

## Install

1. In WordPress, go to **Plugins > Add New Plugin > Upload Plugin**, choose `engineerparts-customer-accounts-1.9.3.zip`, and install it. The ZIP contains a single `engineerparts-customer-accounts` plugin folder.
2. If the older **EngineerParts Customer Accounts** plugin is already installed, deactivate it before activating this package. This package uses a new folder name to avoid WordPress failing while trying to replace a locked or non-writable plugin directory. Keep the old folder as a backup until the new plugin is activated and its API is verified; never run both copies at once.
3. Add these constants to `wp-config.php`, using the same randomly generated secret as the Next.js `ENGINEERPARTS_PROXY_SECRET` environment variable. Registration will show “Account registration verification is not configured” until `ENGINEERPARTS_TURNSTILE_SECRET` is set to the secret key for the Cloudflare Turnstile widget used by the storefront:

   ```php
   define('ENGINEERPARTS_PROXY_SECRET', 'replace-with-at-least-32-random-characters');
   define('ENGINEERPARTS_TURNSTILE_SECRET', 'your-cloudflare-turnstile-secret-key');
   define('ENGINEERPARTS_FRONTEND_URL', 'https://engineerparts.com');
   ```

   `ENGINEERPARTS_FRONTEND_URL` is also used to redirect customers to `{FRONTEND_URL}/checkout/success` after payment, in place of WooCommerce's default thank-you page.

4. Activate **EngineerParts Customer Accounts** after WooCommerce.
5. Confirm the `wp_engineerparts_sessions`, `wp_engineerparts_enquiries`, `wp_engineerparts_contacts`, and `wp_engineerparts_clearance_alerts` tables were created. The prefix may differ from `wp_`.
6. Configure and test WordPress transactional email before enabling registration in production.

After verifying the new plugin is active and `/wp-json/engineerparts/v1/` is available, remove the inactive old copy from **Plugins > Installed Plugins**. If WordPress cannot delete it, remove only its `wp-content/plugins/engineerparts-account` folder using the host file manager after confirming the new plugin works.

Headless checkout submits orders through WooCommerce's Store API checkout endpoint and follows the gateway's `payment_result.redirect_url` directly. The storefront forwards WooCommerce's current Store API nonce and cart token to the protected checkout proxy; the plugin restores the cart token to WordPress request context for WooCommerce to load the same cart. Do not disable WooCommerce nonce checks. Confirm the Nomod gateway is enabled and its WooCommerce payment method ID is `nomod`.

## Cash on Delivery and free delivery (1.9.2)

- Enable **WooCommerce > Settings > Payments > Cash on delivery** (gateway ID `cod`). Allow the delivery methods used by the storefront. No additional COD fee is added by this integration; remove any COD surcharges configured in other extensions if present.
- The storefront offers COD only when the actual delivery address is in the UAE (`AE`). The protected checkout endpoint rejects COD for other destinations. Online payment through Nomod remains available.
- COD uses WooCommerce's checkout, order emails, inventory handling and order status. Confirmation says to pay on delivery, not that payment was received. Repeated submissions reuse the same order; changing payment methods after an order exists requires resolving that order first.
- For an AED store, a product subtotal **after discounts, before VAT and delivery, of AED 200 or more** makes all existing delivery rates free, including shipping tax. This applies to every supported destination, not only the UAE. Existing rates apply below AED 200; no new shipping zones or unsupported destinations are introduced. Local pickup rates are unchanged.
- The delivery rule also applies to native WooCommerce carts/checkouts so all channels charge consistently. Other store currencies are not converted to AED and retain their existing rates.
- Deploy the website and plugin together. The website reads shipping totals from WooCommerce; installing only one side is insufficient.

Generate the shared secret with a password manager or `openssl rand -hex 32`. Never expose it through a `NEXT_PUBLIC_` variable.

## Customer-facing emails and pages (1.9.3)

- Keep the Shop, Cart, Checkout and My account pages published and assigned in WooCommerce. Do not delete them: gateways and internal order URLs can depend on their IDs and endpoints.
- Ordinary public visits to the backend home, shop, product/category, cart, checkout and account pages redirect to `ENGINEERPARTS_FRONTEND_URL`. Admin access, APIs, AJAX, cron, POST requests, gateway callbacks and `order-pay` are not redirected. Valid order-received links go to the storefront confirmation; invalid keys never expose the order.
- Customer WooCommerce HTML/multipart messages use the same black/red EngineerParts shell as the plugin's verification, enquiry and contact emails, preserving order details and attachments. Plain-text emails stay plain text. Admin email bodies are not rewritten. Sender display names are EngineerParts; keep authenticated SMTP sender-address settings unchanged.
- Customer email links to the backend are mapped to public storefront routes. Backend-hosted email images are omitted rather than replaced with broken frontend images. Core customer welcome/password/email-change notifications are branded too; administrator password-reset links remain unchanged.
- Order-payment links open `/checkout/pay` on the main website, including guest orders. An explicit button starts the existing Nomod payment after the order key/status are rechecked; merely opening/scanning an email link does not start payment. Deploy the website before installing this version. COD never starts online payment.
- Keep PHP DOM/XML enabled for formatted email content. Without it, an explicit server log warns and order text is preserved inside the branded shell without its original table formatting. Run `php scripts/test-customer-emails.php` and send real test messages from each enabled customer email type after deployment.
- WooCommerce download links lead to the account order page instead of backend download endpoints. The storefront does not implement digital-file delivery; if you sell downloadable products, add an authorized storefront download flow before enabling this policy.
- This covers plugin, core customer account and WooCommerce emails, not third-party SMTP-provider footers, marketing plugins, PDF attachment contents, transport headers or payment-provider messages. Audit those separately. Necessary gateway/payment screens may still use the backend; hiding the hostname throughout those flows requires gateway-specific integration, not deleting pages.

## WordPress requirements

- HTTPS on both WordPress and Next.js
- Cloudflare Turnstile site key configured as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Next.js and its secret key configured as `ENGINEERPARTS_TURNSTILE_SECRET` in `wp-config.php`. Restrict the Turnstile widget to the storefront hostname.
- Pretty permalinks enabled
- WooCommerce account creation enabled
- Guest checkout left enabled for the existing storefront flow
- Working `wp_mail` delivery, preferably through an authenticated SMTP provider
- A WooCommerce REST API key with only the permissions required by the existing catalog/order integration

No JWT plugin is required. Browser requests go only to Next.js, so WordPress CORS access for `engineerparts.com` is not required.

## Email verification troubleshooting

Version 1.9.1 URL-encodes email addresses in verification links so a `+` in an email address is not decoded as a space. After upgrading, use **Resend verification** to obtain a corrected link. Previously sent links are not rewritten, and resending replaces the previous verification token.

## Security model

- Customer passwords are verified by WordPress and are never stored by Next.js.
- The plugin stores only SHA-256 hashes of random session and verification tokens.
- Next.js stores the opaque session token in an HTTP-only, `SameSite=Lax`, production-secure cookie.
- Password reset uses WordPress-native reset keys.
- Auth endpoints require the server-to-server proxy secret and apply rate limits.
- Registration CAPTCHA tokens are verified by WordPress with Cloudflare Turnstile before a WooCommerce customer is created; registration fails closed if the secret is not configured or verification cannot complete.
- Unverified customers cannot sign in.
- Every order lookup verifies that the authenticated customer owns the WooCommerce order.
- Nomod account payment links use the storefront's key-validated `/checkout/pay` page and do not sign customers into the backend. Other gateways retain the five-minute, single-use payment handoff so the backend can sign in the order owner and open the payment page. That browser login expires within one hour. Customer passwords are never included in the handoff.
- Headless order checkout is serialized by an idempotency key before the request is passed to WooCommerce's Store API. WooCommerce remains responsible for validating, reserving, reducing, and releasing stock; the storefront does not change product stock directly. Retries for the same checkout reuse the existing WooCommerce order instead of creating a second one.

Enable **Manage stock** and set a real stock quantity on every inventory-limited product. In **WooCommerce > Settings > Products > Inventory**, set **Hold stock (minutes)** to a positive period appropriate for payment completion (60 minutes is a reasonable starting point). Keep WP-Cron/Action Scheduler running so expired unpaid orders are cancelled and their stock holds released. Do not set the hold period to zero if customers need time to complete hosted payment.

If a verified payment callback arrives after WooCommerce has already failed or cancelled the storefront order (and released its hold), the plugin moves that order to **On hold** and suppresses stock reduction on future retries. Review the WooCommerce order and payment with Nomod/support before manually reconciling inventory or refunding it.
- Product, lot, and equipment enquiries are stored in `{$wpdb->prefix}engineerparts_enquiries`; general contact messages are stored separately in `{$wpdb->prefix}engineerparts_contacts`. Both tables link submissions to a WooCommerce customer ID when the sender is signed in.
- Clearance alert email registrations are stored separately in `{$wpdb->prefix}engineerparts_clearance_alerts`. Automated stock-alert emails are not implemented yet.
- Saved product IDs use the `engineerparts_saved_products` customer metadata key.
- Existing WooCommerce customers are marked verified after their first successful password login; newly registered customers must verify by email. The storefront also accepts WooCommerce's native email confirmation when it matches the customer's current account email.

## Account endpoints

The plugin exposes controlled routes under `/wp-json/engineerparts/v1/` for authentication, profile and address updates, password changes, customer-owned orders and payment handoffs, headless checkout payment redirects, reorder validation, enquiries, and saved products. Every route requires the server-to-server proxy secret. Customer routes additionally require a valid opaque session token.

Guest submissions are proxied by Next.js and rate-limited. Product, lot, and equipment enquiries require a phone number and are stored in `{$wpdb->prefix}engineerparts_enquiries`; general contact messages also require a phone number and are stored in `{$wpdb->prefix}engineerparts_contacts`; clearance-alert signups are stored in `{$wpdb->prefix}engineerparts_clearance_alerts`. All three appear in separate sections under the single **WooCommerce > EngineerParts Enquiries** admin page. Listing-enquiry records can be viewed, edited, and deleted; contact messages and alert subscribers can be viewed. On upgrade, the plugin copies existing `ep_enquiry` posts into the listing-enquiry table without deleting the originals, and migrates legacy contact and alert records into their separate tables. The submitted details are emailed to the WordPress admin email configured under **Settings > General** and to the customer for contact/listing enquiries. Clearance-alert emails are not yet sent. Guest listing enquiries can be claimed after login only when both the stored RFQ reference and verified account email match.

### Application logs

`POST /logs` stores batches of storefront log entries (sent by the Next.js server logger in production, including browser errors relayed through `/api/logs`) in `{$wpdb->prefix}engineerparts_logs`. Each entry has a level (`debug`, `info`, `warn`, `error`), event name, source (`server` or `client`), JSON context and timestamp; secrets and card fields are redacted before they leave Next.js. Browse and filter them under **WooCommerce > EngineerParts Logs**. Entries older than 30 days are deleted by the daily `engineerparts_purge_sessions` cron; change the window with the `engineerparts_log_retention_days` filter.

Configure and test WordPress email delivery (preferably authenticated SMTP) and set the correct site email under **Settings > General**. Enquiry records are still saved if email delivery fails; WordPress logs mail failures and the storefront tells the customer their enquiry was saved but a notification could not be sent. Email verification and password reset also depend on working WordPress email delivery.

Account verification, password reset, contact confirmation, and listing-enquiry emails use a responsive EngineerParts HTML layout with the storefront's black, red, and neutral colors. WooCommerce transactional emails use the same brand colors. Clearance-alert signups are stored for future use but do not send alert emails yet.