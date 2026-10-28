const wooCommerceUrl = process.env.WOOCOMMERCE_URL;
const wooCommerceImagePattern = wooCommerceUrl
  ? [{ protocol: new URL(wooCommerceUrl).protocol.replace(":", ""), hostname: new URL(wooCommerceUrl).hostname }]
  : [];

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
