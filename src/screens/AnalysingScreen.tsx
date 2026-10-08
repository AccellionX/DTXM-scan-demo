import { useEffect, useRef, useState } from "react";
import type { Product } from "../types";

const STEPS = ["Reading label", "Matching ingredient names", "Applying assessment rules"];

type AnalysingScreenProps = {
  product: Product;
  onDone: () => void;
};

export function AnalysingScreen({ product, onDone }: AnalysingScreenProps) {
  const [step, setStep] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStep(1), 450),
      window.setTimeout(() => setStep(2), 900),
      window.setTimeout(() => onDoneRef.current(), 1500),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-3xl leading-tight text-foreground">Checking the label</h1>
        <p className="mt-2 text-[15px] text-muted">{product.product_name}</p>
      </div>
      <ol className="flex flex-col gap-3" aria-live="polite">
        {STEPS.map((label, index) => {
          const state = index < step ? "done" : index === step ? "current" : "waiting";
          return (
            <li
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                  state === "waiting" ? "border-border text-muted" : "border-highlight text-highlight"
                } ${state === "current" ? "step-pulse" : ""}`}
                aria-hidden="true"
              >
                {state === "done" ? "✓" : index + 1}
              </span>
              <span className={state === "waiting" ? "text-muted" : "text-foreground"}>
                {label}
                <span className="sr-only">
                  {state === "done" ? ", done" : state === "current" ? ", in progress" : ", waiting"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
