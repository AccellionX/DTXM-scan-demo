import { useEffect, useRef } from "react";
import type { IngredientAssessment } from "../engine";
import { concernStyle, MarkLabel } from "./marks";

type IngredientSheetProps = {
  item: IngredientAssessment;
  onClose: () => void;
};

export function IngredientSheet({ item, onClose }: IngredientSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const title = item.canonicalName ?? item.label;
  const style = concernStyle(item.concern, item.recognised);
  const titleId = "ingredient-sheet-title";

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex items-end bg-black/70" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[88%] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface px-5 pt-3 pb-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 id={titleId} className="font-serif text-2xl leading-tight text-foreground">
          {title}
        </h2>
        {item.listedAs ? <p className="mt-1 text-sm text-muted">On the label: {item.listedAs}</p> : null}
        <div className="mt-3">
          <MarkLabel style={style} />
        </div>

        <SheetBlock title="What it is" body={item.whatItIs} />
        <SheetBlock title="Why it was flagged" body={item.whyFlagged} />
        <SheetBlock title="Rule triggered" body={item.ruleName ?? "No rule triggered"} />

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function SheetBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-4">
      <h3 className="text-xs tracking-wide text-muted uppercase">{title}</h3>
      <p className="mt-1 text-[15px] leading-relaxed text-foreground">{body}</p>
    </section>
  );
}
