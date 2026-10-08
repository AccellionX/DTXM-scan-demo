type IconProps = {
  className?: string;
};

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function BackIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function ScanIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export type MarkName = "lower" | "some" | "higher" | "insufficient" | "missing";

export function MarkIcon({ name, className }: { name: MarkName; className?: string }) {
  if (name === "lower") {
    return (
      <svg {...base} className={className}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "some") {
    return (
      <svg {...base} className={className}>
        <path d="M12 4.5 20.5 19.5h-17L12 4.5Z" />
      </svg>
    );
  }
  if (name === "higher") {
    return (
      <svg {...base} className={className}>
        <path d="M8 3.5h8l4.5 4.5v8L16 20.5H8L3.5 16v-8L8 3.5Z" />
      </svg>
    );
  }
  if (name === "missing") {
    return (
      <svg {...base} className={className}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    );
  }
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
      <path d="M9.2 9.2a2.8 2.8 0 0 1 4.5 2.2c0 1.6-1.6 2-2.2 2.8" />
      <circle cx="11.5" cy="17" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
