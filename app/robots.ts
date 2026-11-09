import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account/", "/api/", "/cart", "/checkout/", "/login", "/register"],
    },
    sitemap: "https://engineerparts.com/sitemap.xml",
  };
}
