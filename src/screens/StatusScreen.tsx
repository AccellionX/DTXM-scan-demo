type StatusScreenProps = {
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function StatusScreen({
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: StatusScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-3xl leading-tight text-foreground">{title}</h1>
      <p className="text-[15px] leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onPrimary}
        className="h-12 rounded-2xl bg-primary text-base font-semibold text-white"
      >
        {primaryLabel}
      </button>
      {secondaryLabel && onSecondary ? (
        <button
          type="button"
          onClick={onSecondary}
          className="h-12 rounded-2xl border border-border text-base font-medium text-foreground"
        >
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
