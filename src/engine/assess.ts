import { lookupKeys, namesDiffer } from "./normalise";
import { parseIngredientsText, type ParsedIngredient } from "./parseIngredients";
import type {
  AliasChip,
  AliasRecord,
  Assessment,
  AssessmentData,
  IngredientAssessment,
  IngredientRecord,
  RuleRecord,
} from "./types";

export const RECOGNITION_THRESHOLD = 0.6;

export const INSUFFICIENT_REASON =
  "We don't have enough ingredient information to assess this product honestly.";

const HIGHER_REASON =
  "At least one ingredient is marked higher concern by these assessment rules.";

const SOME_REASON =
  "Two or more ingredients are marked some concern, and none are marked higher concern.";

const LOWER_REASON =
  "The matched ingredients are lower concern, with no more than one marked some concern.";

const UNRECOGNISED_WHAT = "This name is not in the illustrative ingredient list.";

const UNRECOGNISED_WHY =
  "It was not given a concern level, because no assessment rule matches it.";

type Hit = {
  id: string;
  surfaces: string[];
};

type Context = {
  map: Map<string, string>;
  ingredientsById: Map<string, IngredientRecord>;
  rulesByIngredient: Map<string, RuleRecord>;
};

type BuiltRow = {
  row: IngredientAssessment;
  chips: AliasChip[];
};

export function assessIngredients(
  text: string | null | undefined,
  data: AssessmentData,
): Assessment {
  const missing = text == null || text.trim() === "";
  if (missing) return emptyAssessment();

  const parsed = parseIngredientsText(text);
  if (parsed.length === 0) return emptyAssessment();

  const context = createContext(data);
  const built = parsed.flatMap((item) => assessParsed(item, context));
  const ingredients = built.map((item) => item.row);
  const aliasChips = dedupeChips(built.flatMap((item) => item.chips));
  const recognisedCount = ingredients.filter((item) => item.recognised).length;
  const totalCount = ingredients.length;
  const recognitionRatio = recognisedCount / totalCount;

  if (recognitionRatio < RECOGNITION_THRESHOLD) {
    return {
      verdict: "insufficient",
      reason: INSUFFICIENT_REASON,
      ingredients,
      aliasChips,
      recognisedCount,
      unrecognisedCount: totalCount - recognisedCount,
      totalCount,
      recognitionRatio,
    };
  }

  const someCount = ingredients.filter((item) => item.concern === "some").length;
  const hasHigher = ingredients.some((item) => item.concern === "higher");

  if (hasHigher) {
    return finish("higher", HIGHER_REASON, ingredients, aliasChips, recognisedCount, recognitionRatio);
  }
  if (someCount >= 2) {
    return finish("some", SOME_REASON, ingredients, aliasChips, recognisedCount, recognitionRatio);
  }
  return finish("lower", LOWER_REASON, ingredients, aliasChips, recognisedCount, recognitionRatio);
}

function finish(
  verdict: Assessment["verdict"],
  reason: string,
  ingredients: IngredientAssessment[],
  aliasChips: AliasChip[],
  recognisedCount: number,
  recognitionRatio: number,
): Assessment {
  return {
    verdict,
    reason,
    ingredients,
    aliasChips,
    recognisedCount,
    unrecognisedCount: ingredients.length - recognisedCount,
    totalCount: ingredients.length,
    recognitionRatio,
  };
}

function emptyAssessment(): Assessment {
  return {
    verdict: "insufficient",
    reason: INSUFFICIENT_REASON,
    ingredients: [],
    aliasChips: [],
    recognisedCount: 0,
    unrecognisedCount: 0,
    totalCount: 0,
    recognitionRatio: null,
  };
}

function createContext(data: AssessmentData): Context {
  return {
    map: buildAliasMap(data.aliases),
    ingredientsById: new Map(data.ingredients.map((item) => [item.id, item])),
    rulesByIngredient: new Map(data.rules.map((rule) => [rule.ingredient_id, rule])),
  };
}

export function buildAliasMap(aliases: AliasRecord[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const alias of aliases) {
    for (const key of lookupKeys(alias.alias)) {
      const existing = map.get(key);
      if (existing && existing !== alias.ingredient_id) {
        throw new Error(`Alias collision on "${key}" between ${existing} and ${alias.ingredient_id}`);
      }
      map.set(key, alias.ingredient_id);
    }
  }
  return map;
}

function assessParsed(parsed: ParsedIngredient, context: Context): BuiltRow[] {
  const labelHits = resolveLabel(parsed.label, context.map);

  if (labelHits && labelHits.length > 1) {
    return labelHits.map((hit) => toRow(hit.surfaces[0] ?? parsed.label, hit, context));
  }

  const synonymHits = parsed.synonyms.flatMap((synonym) => {
    const hits = resolveLabel(synonym, context.map) ?? [];
    return hits.map((hit) => ({
      id: hit.id,
      surfaces: [synonym, ...hit.surfaces],
    }));
  });

  if (!labelHits || labelHits.length === 0) {
    const ids = [...new Set(synonymHits.map((hit) => hit.id))];
    if (ids.length === 0) return [unrecognised(parsed.label)];
    if (ids.length === 1) {
      const surfaces = synonymHits.flatMap((hit) => hit.surfaces);
      return [toRow(parsed.label, { id: ids[0], surfaces }, context)];
    }
    return ids.map((id) => {
      const surfaces = synonymHits.filter((hit) => hit.id === id).flatMap((hit) => hit.surfaces);
      return toRow(surfaces[0] ?? parsed.label, { id, surfaces }, context);
    });
  }

  const main = labelHits[0];
  const same = synonymHits.filter((hit) => hit.id === main.id);
  const extras = synonymHits.filter((hit) => hit.id !== main.id);
  const rows = [
    toRow(parsed.label, { id: main.id, surfaces: [...main.surfaces, ...same.flatMap((hit) => hit.surfaces)] }, context),
  ];
  const seen = new Set<string>([main.id]);
  for (const extra of extras) {
    if (seen.has(extra.id)) continue;
    seen.add(extra.id);
    rows.push(toRow(extra.surfaces[0] ?? parsed.label, extra, context));
  }
  return rows;
}

function resolveLabel(label: string, map: Map<string, string>): Hit[] | null {
  const direct = lookupId(label, map);
  if (direct) return [{ id: direct, surfaces: [label] }];
  if (!label.includes("/")) return null;

  const hits: Hit[] = [];
  for (const part of label.split("/")) {
    const surface = part.trim();
    if (!surface) continue;
    const id = lookupId(surface, map);
    if (!id) continue;
    const existing = hits.find((hit) => hit.id === id);
    if (existing) existing.surfaces.push(surface);
    else hits.push({ id, surfaces: [surface] });
  }

  return hits.length > 0 ? hits : null;
}

function lookupId(raw: string, map: Map<string, string>): string | null {
  for (const key of lookupKeys(raw)) {
    const id = map.get(key);
    if (id) return id;
  }
  return null;
}

function toRow(label: string, hit: Hit, context: Context): BuiltRow {
  const ingredient = context.ingredientsById.get(hit.id);
  const rule = context.rulesByIngredient.get(hit.id);
  if (!ingredient || !rule) return unrecognised(label);

  return {
    row: {
      label,
      recognised: true,
      ingredientId: ingredient.id,
      canonicalName: ingredient.name,
      concern: rule.concern,
      whatItIs: ingredient.note,
      whyFlagged: rule.why,
      ruleId: rule.id,
      ruleName: rule.name,
      listedAs: namesDiffer(label, ingredient.name) ? label : null,
    },
    chips: chipsFor(hit.surfaces, ingredient.name),
  };
}

function unrecognised(label: string): BuiltRow {
  return {
    row: {
      label,
      recognised: false,
      ingredientId: null,
      canonicalName: null,
      concern: null,
      whatItIs: UNRECOGNISED_WHAT,
      whyFlagged: UNRECOGNISED_WHY,
      ruleId: null,
      ruleName: null,
      listedAs: null,
    },
    chips: [],
  };
}

function chipsFor(surfaces: string[], canonical: string): AliasChip[] {
  const chips: AliasChip[] = [];
  const seen = new Set<string>();
  for (const surface of surfaces) {
    const from = surface.trim();
    if (!from || !namesDiffer(from, canonical)) continue;
    const key = from.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    chips.push({ from, to: canonical });
  }
  return chips;
}

function dedupeChips(chips: AliasChip[]): AliasChip[] {
  const seen = new Set<string>();
  const result: AliasChip[] = [];
  for (const chip of chips) {
    const key = `${chip.from.toLowerCase()}=>${chip.to.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(chip);
  }
  return result;
}
