import type { Product } from "../types";

/**
 * Open Beauty Facts, checked 8 Oct 2026.
 *
 * Barcode (v2), status 1 when found and status 0 when missing:
 * https://world.openbeautyfacts.org/api/v2/product/{barcode}.json
 *
 * Full-text name search is not on /api/v2/search (that route is filter-only).
 * The JSON name search that returns products is the v1 endpoint below.
 * `page_size=10` and `fields` were verified; the response is CORS-enabled.
 */
const SEARCH_ENDPOINT = "https://world.openbeautyfacts.org/cgi/search.pl";
const USER_AGENT = "DetoxiqueScan/1.0 (concept demo; https://www.detoxiquemanchester.com)";

const FIELDS = "code,product_name,brands,image_front_url,ingredients_text";

export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ProductNotFoundError";
  }
}

export class ProductLookupError extends Error {
  constructor(message = "We couldn't reach the product database. Check your connection and try again.") {
    super(message);
    this.name = "ProductLookupError";
  }
}

type RawProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  ingredients_text?: string;
};

export function normaliseBarcode(input: string): string | null {
  const compact = input.replace(/[\s-]/g, "");
  if (!/^\d{8,14}$/.test(compact)) return null;
  return compact;
}

export function mapProduct(raw: RawProduct | null | undefined, fallbackCode?: string): Product | null {
  if (!raw) return null;
  const name = clean(raw.product_name);
  const brands = clean(raw.brands);
  const code = clean(raw.code) || clean(fallbackCode);
  const image = clean(raw.image_front_url);
  const ingredients = clean(raw.ingredients_text);
  if (!name && !brands && !code && !ingredients) return null;

  return {
    code: code || null,
    product_name: name || "Unnamed product",
    brands: brands || "Brand not listed",
    image_front_url: image || null,
    ingredients_text: ingredients || null,
  };
}

export async function fetchProductByBarcode(barcode: string): Promise<Product> {
  const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const payload = (await fetchJson(url)) as { status?: number; product?: RawProduct; code?: string };
  if (!payload || payload.status === 0 || !payload.product) throw new ProductNotFoundError();
  const product = mapProduct(payload.product, payload.code ?? barcode);
  if (!product) throw new ProductNotFoundError();
  return product;
}

export async function searchProductsByName(query: string): Promise<Product[]> {
  const term = query.trim();
  if (!term) return [];

  let payload: unknown;
  try {
    payload = await fetchJson(searchUrl(term, true));
  } catch (error) {
    if (error instanceof ProductNotFoundError) throw error;
    payload = await fetchJson(searchUrl(term, false));
  }

  const products = (payload as { products?: RawProduct[] } | null)?.products;
  if (!Array.isArray(products)) return [];

  return products
    .map((item) => mapProduct(item))
    .filter((item): item is Product => item !== null)
    .slice(0, 10);
}

export function lookupErrorMessage(error: unknown): string {
  if (error instanceof ProductLookupError) return error.message;
  return "We couldn't reach the product database. Check your connection and try again.";
}

function searchUrl(term: string, withFields: boolean): string {
  const params = new URLSearchParams({
    search_terms: term,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "10",
  });
  if (withFields) params.set("fields", FIELDS);
  return `${SEARCH_ENDPOINT}?${params.toString()}`;
}

async function fetchJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ProductLookupError();
  }

  if (response.status === 404) throw new ProductNotFoundError();
  if (!response.ok) throw new ProductLookupError();

  try {
    return await response.json();
  } catch {
    throw new ProductLookupError();
  }
}

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}
