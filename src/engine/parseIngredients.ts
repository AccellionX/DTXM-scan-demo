export type ParsedIngredient = {
  label: string;
  synonyms: string[];
};

export function parseIngredientsText(input: string | null | undefined): ParsedIngredient[] {
  if (input == null) return [];

  const withoutMarks = input.replace(/[*†‡]/g, " ");
  const compact = withoutMarks.replace(/[ \t\f\v]+/g, " ").trim();
  if (!compact) return [];

  const results: ParsedIngredient[] = [];

  for (const segment of splitTopLevel(compact)) {
    const extracted = extractGroups(segment);
    const base = tidy(extracted.base);
    const inners = extracted.inners.map(tidy).filter(Boolean);
    const commaSeparated = inners.some((inner) => splitTopLevel(inner).length > 1);

    if (!base && inners.length === 0) continue;

    if (commaSeparated) {
      if (base) results.push(toParsed(base));
      for (const inner of inners) {
        for (const piece of splitTopLevel(inner)) {
          const label = tidy(piece);
          if (label) results.push(toParsed(label));
        }
      }
      continue;
    }

    if (!base) {
      for (const inner of inners) results.push(toParsed(inner));
      continue;
    }

    const synonyms = inners.filter((inner) => normaliseLoose(inner) !== normaliseLoose(base));
    results.push(toParsed(base, synonyms));
  }

  return results;
}

function toParsed(label: string, synonyms: string[] = []): ParsedIngredient {
  const extra = slashParts(label);
  const combined = [...synonyms, ...extra].filter(
    (synonym) => normaliseLoose(synonym) !== normaliseLoose(label),
  );
  return { label, synonyms: unique(combined) };
}

function slashParts(label: string): string[] {
  if (!label.includes("/")) return [];
  return label
    .split("/")
    .map(tidy)
    .filter((part) => part.length > 0 && normaliseLoose(part) !== normaliseLoose(label));
}

function tidy(value: string): string {
  return value
    .replace(/\b\d+(?:\.\d+)?\s*%/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,:;]+|[,:;]+$/g, "")
    .trim();
}

function normaliseLoose(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = normaliseLoose(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

/** Split on commas and semicolons that are outside brackets. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of input) {
    if (char === "(" || char === "[") depth += 1;
    else if ((char === ")" || char === "]") && depth > 0) depth -= 1;

    if ((char === "," || char === ";") && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  parts.push(current);
  return parts;
}

function extractGroups(segment: string): { base: string; inners: string[] } {
  const inners: string[] = [];
  let base = "";
  let depth = 0;
  let inner = "";

  for (const char of segment) {
    if (char === "(" || char === "[") {
      if (depth === 0) {
        depth = 1;
        inner = "";
      } else {
        depth += 1;
        inner += char;
      }
      continue;
    }

    if (char === ")" || char === "]") {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0) {
          inners.push(inner);
          inner = "";
        } else {
          inner += char;
        }
      }
      continue;
    }

    if (depth === 0) base += char;
    else inner += char;
  }

  if (depth > 0 && inner.trim()) inners.push(inner);
  return { base, inners };
}
