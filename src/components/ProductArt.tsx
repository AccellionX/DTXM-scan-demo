import { useState } from "react";

type ProductArtProps = {
  name: string;
  imageUrl: string | null;
  className?: string;
};

export function ProductArt({ name, imageUrl, className = "h-16 w-16" }: ProductArtProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${className} rounded-2xl border border-border object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${className} flex items-center justify-center rounded-2xl border border-border bg-surface font-serif text-xl text-foreground`}
    >
      {initial}
    </div>
  );
}
