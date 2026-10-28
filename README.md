# Engineerparts

Engineerparts is a responsive industrial marketplace built with Next.js. It provides WooCommerce product and brand browsing, search, enquiries, a cart and checkout flow, and lightweight API endpoints.

## Tech stack

- Next.js 14 with the App Router
- React 18
- TypeScript
- Tailwind CSS
- WooCommerce product catalog
- Browser `localStorage` for the cart and client-side enquiry history
- WordPress/WooCommerce customer authentication through secure server-side proxying

Checkout accepts non-empty first and last names, including single-character names and initials. Customer carts are saved separately by customer ID in this browser. Successful sign-out hides the customer's cart and resets quoted totals and the checkout retry reference across open tabs; signing back into the same account restores its saved items. Other customers cannot see that cart through the storefront. Guest items merge into the customer's saved cart on sign-in, capped by stock, and are no longer shown after logout. Explicit cart clearing and confirmed checkout remove the active saved items. History-restored pages reload the current browser cart. Carts do not sync across devices and are lost if site storage is cleared; carts permanently deleted by the previous logout behavior cannot be recovered.

Customer-facing forms mark mandatory fields with an asterisk (*) and explain the marker; optional fields remain unmarked. They identify missing or invalid fields and preserve entered values after failures. Account, checkout, enquiry and subscription requests use safe recovery messages for expired sessions, rate limits, CAPTCHA failures and connectivity problems; internal service details are logged rather than displayed. Uncertain order/payment outcomes instruct customers to check the existing order before retrying. Run the focused regression checks with `node --test scripts/test-checkout-logout.cjs`.

## Checkout payment and delivery rules

Deploy the website with Customer Accounts plugin **1.9.3**. In WooCommerce payment settings, enable both Nomod (`nomod`) and Cash on delivery (`cod`), allowing the storefront's shipping methods. COD is offered for UAE delivery addresses only and adds no fee. COD submission shows an order-placement message and opens the local order confirmation, without an online-payment handoff. Online payment remains available for other supported destinations.

In an AED store, products totalling **AED 200 or more after discounts and before VAT/delivery** qualify for free delivery to all supported destinations. Below AED 200, existing WooCommerce shipping rates apply. The plugin applies the rule to actual shipping rates and shipping tax, including native WooCommerce checkout; it does not add shipping zones or alter local pickup. Do not configure conflicting COD surcharges in other extensions. Run server-policy checks with `php scripts/test-checkout-policy.php`.

Customer transactional emails share the EngineerParts theme and use the public website for account/order links. Email payment links open `/checkout/pay`, where a deliberate submit rechecks the order key and unpaid status before requesting a hosted Nomod payment. Keep the four WooCommerce pages configured; ordinary public storefront visits redirect to the main website, while payment/API/admin endpoints remain available. Deploy both website and plugin. Run email/redirect checks with `php scripts/test-customer-emails.php`. Third-party emails, PDF contents and gateway screens require separate review.

## Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) 18.17 or newer (Node.js 20 LTS is recommended)
- npm, which is included with Node.js

Check that both are available:

```bash
node --version
npm --version
```

## Run locally

1. Open a terminal in the application directory:

   ```powershell
   cd "C:\Users\Bhatia\Downloads\Code File\workspace"
   ```

2. Install the locked dependency versions:

   ```bash
   npm ci
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in a browser.

The development server reloads the page automatically when source files change. Stop it with `Ctrl+C`.

WooCommerce configuration is required to display products. Without it, the product catalog is empty.

## Connect WooCommerce

1. In WordPress, open **WooCommerce > Settings > Advanced > REST API**.
2. Create a key with **Read/Write** access for a user who can read products and create orders.
3. Copy `.env.example` to `.env`.
4. Replace the example values:

  ```env
  WOOCOMMERCE_URL=https://your-wordpress-site.azurewebsites.net
  WORDPRESS_URL=https://your-wordpress-site.azurewebsites.net
  WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key
  WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret
  ENGINEERPARTS_PROXY_SECRET=generate_at_least_32_random_characters
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
  NEXT_PUBLIC_WHATSAPP_NUMBER=
  NEXT_PUBLIC_CONTACT_EMAIL=
  ```

5. Restart `npm run dev` after changing environment variables.

The app fetches all published WooCommerce products in pages of 100 and caches responses for five minutes. Keys are read only by server code and are never sent to the browser. HTTPS stores use Basic Authentication; local HTTP stores use OAuth 1.0 request signing as required by WooCommerce. If the authenticated REST API rejects the key, the app falls back to WooCommerce's public Store API and still displays published products. Create the REST API key for an Administrator or Shop Manager user to expose custom metadata and create checkout orders. Product currency is read from WooCommerce's Store API. `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_CONTACT_EMAIL` are optional public contact details; set only company-approved values in `.env`. Use `NEXT_PUBLIC_WHATSAPP_NUMBER` as the single source for all company phone contacts and WhatsApp links, including the country code (for example, `"+971 50 601 8048"`). WhatsApp links automatically remove phone formatting. Restart the development server after changes; production builds must be rebuilt because Next.js embeds public environment variables at build time. Unset details are not displayed.

### Customer accounts

Customer authentication uses the dedicated plugin in `wordpress-plugin/engineerparts-account`. Install it on WordPress and follow its README before enabling account registration in production. The confirmed production mapping is:

- Next.js: `https://engineerparts.com`
- WordPress/WooCommerce: `https://shop.engineerparts.com`

Use the same `ENGINEERPARTS_PROXY_SECRET` value in the Next.js environment and WordPress `wp-config.php`. The value must contain at least 32 random characters. It must never use a `NEXT_PUBLIC_` prefix.

The plugin uses WooCommerce customers, WordPress password handling, required email verification, WordPress-native reset keys, and revocable opaque sessions. No JWT plugin or separate customer database is required. Configure reliable WordPress SMTP/email delivery before launch; registration verification and password reset depend on `wp_mail`.

### Inventory and payment safety

Checkout submits orders through the WooCommerce Store API. WooCommerce is the only component that reserves, reduces, and releases product stock; the storefront does not manually decrement inventory. The WordPress plugin serializes retries with the same checkout reference and returns the existing order rather than creating a duplicate. Payment returns remain pending until WooCommerce reports a paid order status. A verified payment callback arriving after an order's hold was released is kept **On hold** for manual reconciliation rather than reducing stock late.

Enable **Manage stock** and set a real quantity on each limited-stock WooCommerce product. In **WooCommerce > Settings > Products > Inventory**, configure **Hold stock (minutes)** to a positive period (for example, 60 minutes) and keep WP-Cron/Action Scheduler running so expired unpaid orders release their stock holds. Deploy the updated `wordpress-plugin/engineerparts-account` plugin first (it adds the idempotent checkout endpoint), then deploy the Next.js application.

Required WordPress configuration:

1. Enable WooCommerce customer account creation.
2. Keep guest checkout enabled unless the business intentionally changes that policy.
3. Enable pretty permalinks.
4. Install and activate WooCommerce, then activate the EngineerParts plugin.
5. Retain the existing least-privilege WooCommerce REST API key for catalog/order operations.
6. Configure and test transactional email delivery.
7. Serve both applications over HTTPS.
8. Do not expose WordPress account endpoints through browser CORS; Next.js proxies them server-side.
9. Create a Cloudflare Turnstile widget for the storefront hostname, set its site key as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Next.js, and set its secret key in WordPress as `ENGINEERPARTS_TURNSTILE_SECRET`. Registration is blocked until both keys are configured.

### Connect Nomod payments

1. In Nomod, open **Settings > Tools & customisations > Apps & APIs > WooCommerce**, create an API key, and copy it.
2. In WordPress, install and activate **Nomod for WooCommerce** from **Plugins > Add New**.
3. Open **WooCommerce > Settings > Payments > Nomod**, enable the gateway, paste the Nomod API key, and save.

Checkout orders are created in WooCommerce with Nomod selected, then customers are redirected to WooCommerce's secure order-payment page. WooCommerce and the Nomod plugin handle payment confirmation and order status updates.

For Azure App Service, add the same three names under **Configuration > Application settings**, then restart the Next.js app. Do not prefix secrets with `NEXT_PUBLIC_` and do not commit `.env.local`.

### WooCommerce field mapping

Standard WooCommerce fields map automatically: ID, SKU, name, slug, description, price, stock, publication date, categories, images, and attributes. Product attributes named `Brand`, `Manufacturer`, `Part Number`, `Model`, and `Condition` are also recognized.

Optional WooCommerce custom metadata can enrich listings:

| Metadata key | Example |
| --- | --- |
| `brand` | Product brand |
| `manufacturer` | Manufacturer name |
| `part_number` | Manufacturer part number |
| `model` | Product model |
| `condition` | `New Old Stock` |
| `condition_notes` | `Original carton opened for inspection` |
| `listing_type` | `Buy Now` |
| `warehouse_location` | Stock location |
| `lot_id` | Optional lot reference |
| `badges` | `CLEARANCE,SURPLUS` |
| `lead_time` | `Ships within 2 working days` |

Supported condition values are `New Surplus`, `New Old Stock`, `Refurbished`, `Used - Good`, `Used - Fair`, `For Parts / Repair`, and `Mixed`. Supported listing types are `Buy Now`, `Buy or Enquire`, `Whole Lot`, and `Equipment Enquiry`.

## Production build

Create and run an optimized production build:

```bash
npm ci
npm run build
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

Run the code-quality checks separately:

```bash
npm run typecheck
npm run lint
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the development server on port 3000 |
| `npm run build` | Creates an optimized production build |
| `npm start` | Serves the production build on port 3000 |
| `npm run typecheck` | Checks TypeScript without emitting files |
| `npm run lint` | Runs the Next.js ESLint checks |

## Main features

- Browse live WooCommerce products and brands
- Filter catalog pages and search inventory
- View product images, specifications, documents, stock, and pricing
- Add products to a persistent browser cart
- Submit product and contact enquiries
- Complete the checkout flow
- Browse recently added stock and live brands
- Record lightweight page-view analytics through an API route

## Application routes

| Route | Description |
| --- | --- |
| `/` | Home page and featured inventory |
| `/search` | Search results and catalog filtering |
| `/product/[slug]` | Product details |
| `/brands` and `/brands/[brand]` | Brand listing and inventory |
| `/clearance` | All live WooCommerce products |
| `/recently-added` | Recently added inventory |
| `/cart` | Shopping cart |
| `/checkout` | Checkout form |
| `/my-enquiries` | Redirects to the protected account enquiry history |
| `/login`, `/register` | WooCommerce customer authentication |
| `/forgot-password`, `/reset-password` | WordPress password recovery |
| `/account` | Protected customer dashboard |
| `/account/orders` | Customer-owned WooCommerce orders |
| `/account/enquiries` | Persistent customer enquiries and RFQs |
| `/account/saved-products` | Products saved to the customer account |
| `/account/addresses` | WooCommerce billing and shipping addresses |
| `/account/profile` | Customer and B2B profile details |
| `/account/security` | Password and active-session security |
| `/about` | About Engineerparts |
| `/contact` | Contact form |

## API routes

| Endpoint | Methods | Current behavior |
| --- | --- | --- |
| `/api/leads` | `POST` | Persists guest or customer-linked enquiries in WordPress |
| `/api/orders` | `POST` | Creates a pending WooCommerce order and returns its secure payment-page URL |
| `/api/auth/[action]` | `GET`, `POST` | Proxies controlled WordPress authentication operations |
| `/api/account/*` | `GET`, `POST`, `PUT` | Proxies authenticated customer-owned account resources |
| `/api/analytics` | `GET`, `POST` | Records and reports temporary page-view data |
| `/api/search` | `GET` | Returns WooCommerce product and brand suggestions |
| `/api/import` | `GET`, `POST` | Documents the reserved future catalog-import contract |

Analytics storage remains a prototype. Enquiries are persisted as private WordPress `engineerparts_enquiry` posts and associated with authenticated WooCommerce customer IDs.

## Project structure

```text
app/                    Next.js pages, layouts, and API route handlers
  api/                  Lead, order, analytics, and import endpoints
  product/              Dynamic product detail pages
components/             Shared React components
  cards/                Product and brand cards
  providers/            Cart, enquiry, and toast state providers
  product/              Product detail components
  home/                 Home-page sections
lib/                    Types, search, analytics, utilities, and domain logic
  data/                 Empty compatibility modules and live-brand helpers
```

The `@/` import alias points to the project root, so `@/components/Header` resolves to `components/Header.tsx`.

## Data and persistence

Products come only from WooCommerce. The files under `lib/data/` intentionally contain no product, lot, equipment, brand, or category records. They preserve existing type-safe module contracts while those features are either live-derived or disabled.

- `lib/data/products.ts`
- `lib/data/lots.ts`
- `lib/data/equipment.ts`
- `lib/data/brands.ts`
- `lib/data/categories.ts`

Manage products, prices, stock, images, categories, and attributes in WooCommerce. Do not add inventory records to `lib/data/`.

Cart state and the user's enquiry list are stored in the browser's `localStorage`. Clearing site data or using another browser/device removes that local state. Submitted leads reach the temporary API prototype; submitted orders are persisted in WooCommerce before payment continues on its order-payment page.

## Images

The application uses Next.js image optimization. Remote images are currently allowed from:

- `images.unsplash.com`
- `plus.unsplash.com`
- The hostname configured in `WOOCOMMERCE_URL`

To use another remote image host, add it to `images.remotePatterns` in `next.config.mjs`, then restart the development server.

## Troubleshooting

### Port 3000 is already in use

Stop the process using port 3000, or run development on another port:

```bash
npm run dev -- -p 3001
```

Open `http://localhost:3001` when using the alternate port.

### Dependencies fail to install

Confirm the Node.js version first. Because the repository includes `package-lock.json`, prefer `npm ci` for a clean, reproducible install. If the lock file was intentionally changed through dependency updates, run `npm install` to refresh it.

### A remote image does not load

Confirm the URL is valid and that its hostname is listed in `next.config.mjs`. Local images should be placed under a root-level `public/` directory and referenced from `/`, for example `/images/product.jpg`.

### Production server does not start

Run `npm run build` before `npm start`. The start command serves the generated `.next` build and does not compile the application first.

## Production readiness

Before deploying this as a live marketplace, replace temporary API storage with a database and connect the queued integrations to real email, CRM, ERP, and payment services. Add authentication and authorization for account and administrative operations, validate all imported data, configure monitoring, and provide production environment variables through the hosting platform rather than committing secrets.#   e n g i n e e r p a r t s 
 
 