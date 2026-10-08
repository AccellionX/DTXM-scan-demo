import { useMemo } from "react";
import { assessProduct, type IngredientAssessment } from "../engine";
import type { Product } from "../types";
import { ProductArt } from "../components/ProductArt";
import { concernStyle, MarkLabel, VerdictBadge } from "../components/marks";

type ResultScreenProps = {
  product: Product;
  onSelect: (item: IngredientAssessment) => void;
  onScanAnother: () => void;
};

export function ResultScreen({ product, onSelect, onScanAnother }: ResultScreenProps) {
  const assessment = useMemo(() => assessProduct(product.ingredients_text), [product]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProductArt
          name={product.product_name}
          imageUrl={product.image_front_url}
          className="h-[4.5rem] w-[4.5rem]"
        />
        <div className="min-w-0">
          <h1 className="font-serif text-2xl leading-tight text-foreground">{product.product_name}</h1>
          <p className="mt-1 text-sm text-muted">{product.brands}</p>
        </div>
      </div>

      <VerdictBadge verdict={assessment.verdict} />
      <p className="text-[15px] leading-relaxed text-foreground">{assessment.reason}</p>

      {assessment.aliasChips.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-wide text-muted uppercase">Also known as</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {assessment.aliasChips.map((chip) => (
              <li
                key={`${chip.from}-${chip.to}`}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground"
              >
                {chip.from} = {chip.to}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-sm text-muted">{unrecognisedLine(assessment.totalCount, assessment.unrecognisedCount)}</p>

      <section>
        <h2 className="font-serif text-xl text-foreground">Ingredients</h2>
        {assessment.ingredients.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">Ingredient list not available.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {assessment.ingredients.map((item, index) => {
              const style = concernStyle(item.concern, item.recognised);
              const title = item.canonicalName ?? item.label;
              return (
                <li key={`${item.label}-${index}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border border-border border-l-4 bg-surface px-3 py-3 text-left ${style.edge}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] text-foreground">{title}</span>
                      {item.listedAs ? (
                        <span className="mt-0.5 block text-xs text-muted">On the label: {item.listedAs}</span>
                      ) : null}
                    </span>
                    <MarkLabel style={style} compact />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={onScanAnother}
        className="h-12 rounded-2xl bg-primary text-base font-semibold text-white"
      >
        Scan another product
      </button>
    </div>
  );
}

function unrecognisedLine(total: number, unrecognised: number): string {
  if (total === 0) return "No ingredient list to compare with the rules.";
  if (unrecognised === 1) return "1 ingredient not recognised by the rules.";
  return `${unrecognised} ingredients not recognised by the rules.`;
}
