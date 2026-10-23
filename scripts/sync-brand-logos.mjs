#!/usr/bin/env node
/**
 * Pulls the current list of brands from the live WooCommerce store and
 * appends any brand not already present in data/brand-logos.xlsx as a new
 * row with a blank Logo Source, ready to be filled in.
 *
 * Never edits or removes existing rows - safe to re-run any time.
 *
 * Usage: npm run sync-brands
 */
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const WORKBOOK_PATH = path.join(ROOT, "data", "brand-logos.xlsx");
const SHEET_NAME = "Brand Logos";

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function decodeEntities(value) {
  return value
    .replace(/&(?:amp|nbsp|quot|#039|apos|lt|gt);/g, (entity) =>
      ({ "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#039;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">" })[entity] ?? entity,
    )
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAllProducts() {
  const baseUrl = process.env.WOOCOMMERCE_URL?.replace(/\/$/, "");
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!baseUrl || !key || !secret) {
    throw new Error("Missing WOOCOMMERCE_URL / WOOCOMMERCE_CONSUMER_KEY / WOOCOMMERCE_CONSUMER_SECRET in .env");
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
    "Content-Type": "application/json",
  };

  const products = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = new URL(`${baseUrl}/wp-json/wc/v3/products`);
    url.searchParams.set("status", "publish");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`WooCommerce request failed (${res.status} ${res.statusText})`);
    products.push(...(await res.json()));
    totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
    page += 1;
  } while (page <= totalPages);

  return products;
}

function extractBrand(product) {
  const fromTaxonomy = product.brands?.[0]?.name;
  const fromMeta = product.meta_data?.find((m) => m.key === "brand")?.value;
  const fromAttribute = product.attributes?.find((a) => a.name?.toLowerCase() === "brand")?.options?.join(", ");
  const raw = [fromTaxonomy, fromMeta, fromAttribute].find((v) => typeof v === "string" && v.trim());
  return raw ? decodeEntities(String(raw)) : null;
}

function readWorkbook() {
  if (!fs.existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found at ${WORKBOOK_PATH}. Create it first (see data/brand-logos.xlsx).`);
  }
  return XLSX.readFile(WORKBOOK_PATH);
}

async function main() {
  loadEnv();

  console.log("Fetching live products from WooCommerce...");
  const products = await fetchAllProducts();
  console.log(`Fetched ${products.length} products.`);

  const seen = new Map(); // brand name (lowercase) -> { name, sector, count }
  for (const product of products) {
    const name = extractBrand(product);
    if (!name) continue;
    const sector = decodeEntities(String(product.categories?.[0]?.name ?? ""));
    const key = name.toLowerCase();
    const existing = seen.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      seen.set(key, { name, sector, count: 1 });
    }
  }

  const workbook = readWorkbook();
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found in ${WORKBOOK_PATH}`);

  const existingRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const existingNames = new Set(existingRows.map((r) => String(r["Brand Name"] ?? "").trim().toLowerCase()));

  const newRows = [];
  for (const { name, sector, count } of seen.values()) {
    if (existingNames.has(name.toLowerCase())) continue;
    newRows.push({
      "Brand Name": name,
      "Sector / Category": sector,
      "Clearance Items": count,
      "Logo Source (domain, URL, or /path)": "",
    });
  }

  if (newRows.length === 0) {
    console.log("No new brands found - workbook is already up to date.");
    return;
  }

  // Find the last row (column A) that holds a real brand name, in columns
  // A-E only - the summary block lives off to the side in columns G/H with
  // whole-column formulas, so it never needs to move when we append below.
  let lastDataRowIdx = 0; // 0-indexed; row 0 is the header
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let r = 1; r <= range.e.r; r += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell && String(cell.v).trim()) lastDataRowIdx = r;
  }

  const columns = ["Brand Name", "Sector / Category", "Clearance Items", "Logo Source (domain, URL, or /path)"];
  newRows.forEach((row, i) => {
    const r = lastDataRowIdx + 1 + i; // 0-indexed
    columns.forEach((col, c) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      sheet[addr] = { t: typeof row[col] === "number" ? "n" : "s", v: row[col] };
    });
    const statusAddr = XLSX.utils.encode_cell({ r, c: 4 });
    const rowNum = r + 1; // 1-indexed for the formula
    sheet[statusAddr] = { t: "str", f: `IF(TRIM(D${rowNum})="","Needs manual logo","Fetched")` };
  });

  const newRange = XLSX.utils.decode_range(sheet["!ref"]);
  newRange.e.r = Math.max(newRange.e.r, lastDataRowIdx + newRows.length);
  newRange.e.c = Math.max(newRange.e.c, 7);
  sheet["!ref"] = XLSX.utils.encode_range(newRange);

  XLSX.writeFile(workbook, WORKBOOK_PATH);
  console.log(`Added ${newRows.length} new brand(s) to ${WORKBOOK_PATH}:`);
  newRows.forEach((r) => console.log(`  - ${r["Brand Name"]}`));
  console.log("Fill in column D for these rows, then rebuild the site.");
}

main().catch((err) => {
  console.error("sync-brand-logos failed:", err.message);
  process.exit(1);
});
