const wooCommerceUrl = process.env.WOOCOMMERCE_URL;
const wooCommerceImagePattern = wooCommerceUrl
  ? [{ protocol: new URL(wooCommerceUrl).protocol.replace(":", ""), hostname: new URL(wooCommerceUrl).hostname }]
  : [];

// Baseline hardening headers. A Content-Security-Policy is intentionally not set here yet:
// it needs a nonce strategy for the JSON-LD scripts and the Turnstile widget (see docs/SYSTEM-DESIGN.md).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // xlsx reads files via Node's `fs` at runtime (data/brand-logos.xlsx). Left
  // bundled, webpack hands it a browser-style `fs` shim instead of the real
  // module, which breaks that read. Keeping it external forces a plain
  // `require("xlsx")` in the server bundle so it gets real Node `fs`.
  experimental: {
    serverComponentsExternalPackages: ["xlsx"],
    // Runs instrumentation.ts at server start to install the production log sink.
    instrumentationHook: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "shop.engineerparts.com" },
      ...wooCommerceImagePattern,
    ],
  },
};

export default nextConfig;
