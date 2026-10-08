/** Fold a printed ingredient name into lookup keys. */
export function normaliseName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[*†‡]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b\d+(?:\.\d+)?\s*%/g, " ")
    .replace(/['’.']/g, "")
    .replace(/[^a-z0-9/\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every key that should hit the same alias, including light punctuation variants. */
export function lookupKeys(value: string): string[] {
  const base = normaliseName(value);
  if (!base) return [];

  const keys = new Set<string>();
  keys.add(base);

  const slashTight = base.replace(/\s*\/\s*/g, "/");
  keys.add(slashTight);

  const slashAsSpace = slashTight.replace(/\//g, " ").replace(/\s+/g, " ").trim();
  keys.add(slashAsSpace);

  const hyphenAsSpace = slashAsSpace.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  keys.add(hyphenAsSpace);

  const hyphenRemoved = slashAsSpace.replace(/-/g, "");
  keys.add(hyphenRemoved);

  const compactSource = base.replace(/[\s/-]/g, "");
  if (/\d/.test(base) || compactSource.length <= 8) {
    keys.add(compactSource);
  }

  keys.delete("");
  return [...keys];
}

export function namesDiffer(surface: string, canonical: string): boolean {
  const canonicalKeys = new Set(lookupKeys(canonical));
  return !lookupKeys(surface).some((key) => canonicalKeys.has(key));
}
