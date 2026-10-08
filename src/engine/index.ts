import aliasesJson from "../data/ingredient_aliases.json";
import ingredientsJson from "../data/ingredients.json";
import rulesJson from "../data/rules.json";
import { assessIngredients } from "./assess";
import type { AliasRecord, Assessment, AssessmentData, IngredientRecord, RuleRecord } from "./types";

export const assessmentData: AssessmentData = {
  ingredients: ingredientsJson as IngredientRecord[],
  aliases: aliasesJson as AliasRecord[],
  rules: rulesJson as RuleRecord[],
};

export function assessProduct(ingredientsText: string | null | undefined): Assessment {
  return assessIngredients(ingredientsText, assessmentData);
}

export { assessIngredients, buildAliasMap, INSUFFICIENT_REASON, RECOGNITION_THRESHOLD } from "./assess";
export { parseIngredientsText } from "./parseIngredients";
export { lookupKeys, normaliseName } from "./normalise";
export type {
  AliasChip,
  Assessment,
  AssessmentData,
  ConcernLevel,
  IngredientAssessment,
  Verdict,
} from "./types";
