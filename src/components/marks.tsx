import type { ConcernLevel, Verdict } from "../engine";
import { MarkIcon, type MarkName } from "./icons";

type MarkStyle = {
  kind: MarkName;
  label: string;
  text: string;
  border: string;
  edge: string;
};

const VERDICT_STYLES: Record<Verdict, MarkStyle> = {
  lower: {
    kind: "lower",
    label: "Lower concern",
    text: "text-lower",
    border: "border-lower",
    edge: "border-l-lower",
  },
  some: {
    kind: "some",
    label: "Some concern",
    text: "text-some",
    border: "border-some",
    edge: "border-l-some",
  },
  higher: {
    kind: "higher",
    label: "Higher concern",
    text: "text-higher",
    border: "border-higher",
    edge: "border-l-higher",
  },
  insufficient: {
    kind: "insufficient",
    label: "Insufficient data",
    text: "text-insufficient",
    border: "border-insufficient",
    edge: "border-l-insufficient",
  },
};

const CONCERN_STYLES: Record<ConcernLevel, MarkStyle> = {
  low: VERDICT_STYLES.lower,
  some: VERDICT_STYLES.some,
  higher: VERDICT_STYLES.higher,
};

export function verdictStyle(verdict: Verdict): MarkStyle {
  return VERDICT_STYLES[verdict];
}

export function concernStyle(concern: ConcernLevel | null, recognised: boolean): MarkStyle {
  if (!recognised || !concern) {
    return {
      kind: "missing",
      label: "Not recognised",
      text: "text-insufficient",
      border: "border-insufficient",
      edge: "border-l-insufficient",
    };
  }
  return CONCERN_STYLES[concern];
}

export function MarkLabel({ style, compact = false }: { style: MarkStyle; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${style.text} ${compact ? "text-xs" : "text-sm"}`}>
      <MarkIcon name={style.kind} className={compact ? "h-4 w-4" : "h-5 w-5"} />
      {style.label}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const style = verdictStyle(verdict);
  return (
    <div className={`rounded-2xl border bg-surface px-4 py-4 ${style.border}`}>
      <p className="text-xs tracking-wide text-muted uppercase">Overall verdict</p>
      <div className="mt-2 flex items-center gap-3">
        <MarkIcon name={style.kind} className={`h-8 w-8 ${style.text}`} />
        <p className={`font-serif text-2xl leading-none ${style.text}`}>{style.label}</p>
      </div>
    </div>
  );
}
