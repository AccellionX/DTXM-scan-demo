import { useState, type FormEvent } from "react";
import samples from "../data/sample_products.json";
import type { SampleProduct } from "../types";
import { ScanIcon } from "../components/icons";

const catalogue = samples as SampleProduct[];

type HomeScreenProps = {
  onScan: () => void;
  onSearch: (query: string) => void;
  onSample: (sample: SampleProduct) => void;
};

export function HomeScreen({ onScan, onSearch, onSample }: HomeScreenProps) {
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    onSearch(term);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="brand-fill rounded-3xl px-5 py-6">
        <p className="text-xs font-medium tracking-[0.14em] text-white uppercase">Detoxique Manchester</p>
        <h1 className="mt-3 font-serif text-[1.85rem] leading-[1.15] font-medium text-white">
          Would you still buy it if you understood the label?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white">
          Scan a barcode or search a name. We read the ingredient list and compare it with a short set of assessment rules.
        </p>
      </section>

      <div className="h-0.5 w-10 rounded-full bg-secondary" aria-hidden="true" />

      <button
        type="button"
        onClick={onScan}
        className="brand-fill flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold"
      >
        <ScanIcon className="h-5 w-5" />
        Scan a product
      </button>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="product-search" className="text-sm text-muted">
          Search by product name
        </label>
        <div className="flex gap-2">
          <input
            id="product-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try shampoo or moisturiser"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted"
            enterKeyHint="search"
          />
          <button
            type="submit"
            className="h-12 shrink-0 rounded-2xl bg-primary px-4 text-base font-semibold text-white"
          >
            Search
          </button>
        </div>
      </form>

      <section>
        <h2 className="font-serif text-xl text-foreground">Try a sample</h2>
        <p className="mt-1 text-sm text-muted">These four products work with the camera off.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {catalogue.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSample(sample)}
              className="flex min-h-28 flex-col rounded-2xl border border-border bg-surface p-3 text-left"
            >
              <span className="font-serif text-base leading-snug text-foreground">{sample.product_name}</span>
              <span className="mt-1 text-xs text-muted">{sample.category}</span>
              <span className="mt-auto pt-3 text-xs font-medium text-highlight">View assessment</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
