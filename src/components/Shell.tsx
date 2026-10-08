import type { ReactNode } from "react";
import { BackIcon } from "./icons";

const FOOTER = "Concept demo. Illustrative rules and data, not Detoxique's real assessment criteria.";

type ShellProps = {
  children: ReactNode;
  onBack?: () => void;
  overlay?: ReactNode;
};

export function Shell({ children, onBack, overlay }: ShellProps) {
  return (
    <div className="stage">
      <div className="device-slot">
        <div className="device">
          <div className="flex h-full min-h-0 flex-col bg-background font-sans text-foreground">
            <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Back"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground"
                >
                  <BackIcon className="h-5 w-5" />
                </button>
              ) : null}
              <img
                src="/logo.png"
                alt="Detoxique"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 object-contain mix-blend-lighten"
              />
              <p className="font-serif text-lg leading-none text-foreground">Detoxique Scan</p>
            </header>
            <div className="relative min-h-0 flex-1">
              <main className="h-full overflow-y-auto px-4 py-4">{children}</main>
              {overlay}
            </div>
            <footer className="shrink-0 border-t border-border px-4 pt-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] text-center text-[11px] leading-snug text-muted">
              {FOOTER}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
