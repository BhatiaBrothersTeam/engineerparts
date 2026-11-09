import type { MetadataRoute } from "next";
import { brandsFromProducts } from "@/lib/data/brands";
import { categorySummary } from "@/lib/categories";
import { getProducts } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

const BASE_URL = "https://engineerparts.com";
const STATIC_ROUTES = [
  "",
  "/about",
  "/brands",
  "/categories",
  "/clearance",
  "/clearance/retail",
  "/clearance/wholesale",
  "/contact",
  "/enquiry",
  "/faq",
  "/recently-added",
  "/returns-refunds",
  "/shipping-delivery",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const now = new Date();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: now,
      changeFrequency: route === "" || route.startsWith("/clearance") ? "daily" as const : "monthly" as const,
      priority: route === "" ? 1 : route.startsWith("/clearance") ? 0.9 : 0.6,
    })),
    ...categorySummary(products).map((category) => ({
      url: `${BASE_URL}/clearance/${category.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...brandsFromProducts(products).map((brand) => ({
      url: `${BASE_URL}/brands/${brand.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${BASE_URL}/product/${product.slug}`,
      lastModified: product.added_date ? new Date(product.added_date) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
