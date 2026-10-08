import type { Product } from "../types";
import { ProductArt } from "../components/ProductArt";

type SearchScreenProps = {
  query: string;
  status: "loading" | "ready" | "error";
  results: Product[];
  onPick: (product: Product) => void;
  onRetry: () => void;
};

export function SearchScreen({ query, status, results, onPick, onRetry }: SearchScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl leading-tight text-foreground">Search results</h1>
        <p className="mt-2 text-sm text-muted">Showing matches for “{query}”.</p>
      </div>

      {status === "loading" ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-5 text-[15px]" role="status">
          Looking up products…
        </p>
      ) : null}

      {status === "error" ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-5">
          <h2 className="font-serif text-xl text-foreground">Search didn't go through</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We couldn't reach the product database. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 h-12 rounded-2xl bg-primary px-4 text-base font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : null}

      {status === "ready" && results.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-5">
          <h2 className="font-serif text-xl text-foreground">No products matched</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nothing in Open Beauty Facts matched that name. Try another search, or scan a barcode.
          </p>
        </div>
      ) : null}

      {status === "ready"
        ? results.map((product, index) => (
            <button
              key={`${product.code ?? "product"}-${index}`}
              type="button"
              onClick={() => onPick(product)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left"
            >
              <ProductArt name={product.product_name} imageUrl={product.image_front_url} />
              <span className="min-w-0">
                <span className="block font-serif text-base leading-snug text-foreground">{product.product_name}</span>
                <span className="mt-1 block text-xs text-muted">{product.brands}</span>
              </span>
            </button>
          ))
        : null}
    </div>
  );
}
