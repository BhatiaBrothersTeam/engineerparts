import "server-only";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";

const WORKBOOK_PATH = path.join(process.cwd(), "data", "brand-logos.xlsx");

interface BrandLogoRow {
  name: string;
  source: string;
}

let cache: Map<string, string> | null = null;

function loadRows(): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(WORKBOOK_PATH)) return map;

  const workbook = XLSX.readFile(WORKBOOK_PATH);
  const sheet = workbook.Sheets["Brand Logos"] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return map;

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  for (const row of rows) {
    const name = String(row["Brand Name"] ?? "").trim();
    const source = String(row["Logo Source (domain, URL, or /path)"] ?? "").trim();
    if (!name || !source) continue;
    map.set(name.toLowerCase(), source);
  }
  return map;
}

function getMap(): Map<string, string> {
  if (!cache) cache = loadRows();
  return cache;
}

/**
 * Resolves a brand name to a displayable logo image URL, reading from
 * data/brand-logos.xlsx (the maintained source of truth - see its
 * Instructions sheet). Returns null when the brand has no logo source yet,
 * in which case callers should fall back to an initials/text treatment.
 */
export function resolveBrandLogoUrl(brandName: string): string | null {
  const source = getMap().get(brandName.trim().toLowerCase());
  if (!source) return null;

  if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("/")) {
    return source;
  }
  // Bare domain - fetch the company's icon via Google's favicon service.
  return `https://www.google.com/s2/favicons?domain=${source}&sz=128`;
}

export function listBrandLogoRows(): BrandLogoRow[] {
  return Array.from(getMap().entries()).map(([name, source]) => ({ name, source }));
}
