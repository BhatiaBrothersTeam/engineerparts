# EngineerParts Customer Accounts

This plugin provides the restricted WordPress endpoints used by the EngineerParts Next.js account system. WooCommerce customers remain the source of truth for profiles, addresses, passwords, and orders.

## Install

1. In WordPress, go to **Plugins > Add New Plugin > Upload Plugin**, choose `engineerparts-customer-accounts-1.8.5.zip`, and install it. The ZIP contains a single `engineerparts-customer-accounts` plugin folder.
2. If the older **EngineerParts Customer Accounts** plugin is already installed, deactivate it before activating this package. This package uses a new folder name to avoid WordPress failing while trying to replace a locked or non-writable plugin directory. Keep the old folder as a backup until the new plugin is activated and its API is verified; never run both copies at once.
3. Add these constants to `wp-config.php`, using the same randomly generated secret as the Next.js `ENGINEERPARTS_PROXY_SECRET` environment variable:

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

Generate the shared secret with a password manager or `openssl rand -hex 32`. Never expose it through a `NEXT_PUBLIC_` variable.

## WordPress requirements

- HTTPS on both WordPress and Next.js
- Cloudflare Turnstile site key configured as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Next.js and its secret key configured as `ENGINEERPARTS_TURNSTILE_SECRET` in `wp-config.php`. Restrict the Turnstile widget to the storefront hostname.
- Pretty permalinks enabled
- WooCommerce account creation enabled
- Guest checkout left enabled for the existing storefront flow
- Working `wp_mail` delivery, preferably through an authenticated SMTP provider
- A WooCommerce REST API key with only the permissions required by the existing catalog/order integration

No JWT plugin is required. Browser requests go only to Next.js, so WordPress CORS access for `engineerparts.com` is not required.

## Security model

- Customer passwords are verified by WordPress and are never stored by Next.js.
- The plugin stores only SHA-256 hashes of random session and verification tokens.
- Next.js stores the opaque session token in an HTTP-only, `SameSite=Lax`, production-secure cookie.
- Password reset uses WordPress-native reset keys.
- Auth endpoints require the server-to-server proxy secret and apply rate limits.
- Registration CAPTCHA tokens are verified by WordPress with Cloudflare Turnstile before a WooCommerce customer is created; registration fails closed if the secret is not configured or verification cannot complete.
- Unverified customers cannot sign in.
- Every order lookup verifies that the authenticated customer owns the WooCommerce order.
- Account checkout uses a five-minute, single-use payment handoff so WordPress can sign in the order owner and open the payment page. The resulting browser login expires within one hour. Customer passwords are never included in the handoff.
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

Configure and test WordPress email delivery (preferably authenticated SMTP) and set the correct site email under **Settings > General**. Enquiry records are still saved if email delivery fails; WordPress logs mail failures and the storefront tells the customer their enquiry was saved but a notification could not be sent. Email verification and password reset also depend on working WordPress email delivery.

Account verification, password reset, contact confirmation, and listing-enquiry emails use a responsive EngineerParts HTML layout with the storefront's black, red, and neutral colors. WooCommerce transactional emails use the same brand colors. Clearance-alert signups are stored for future use but do not send alert emails yet.