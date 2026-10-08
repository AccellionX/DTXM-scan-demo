export type ConcernLevel = "low" | "some" | "higher";

export type Verdict = "lower" | "some" | "higher" | "insufficient";

export type IngredientRecord = {
  id: string;
  name: string;
  concern: ConcernLevel;
  note: string;
};

export type AliasRecord = {
  id: string;
  alias: string;
  ingredient_id: string;
};

export type RuleRecord = {
  id: string;
  ingredient_id: string;
  concern: ConcernLevel;
  name: string;
  why: string;
};

export type AssessmentData = {
  ingredients: IngredientRecord[];
  aliases: AliasRecord[];
  rules: RuleRecord[];
};

export type AliasChip = {
  from: string;
  to: string;
};

export type IngredientAssessment = {
  label: string;
  recognised: boolean;
  ingredientId: string | null;
  canonicalName: string | null;
  concern: ConcernLevel | null;
  whatItIs: string;
  whyFlagged: string;
  ruleId: string | null;
  ruleName: string | null;
  listedAs: string | null;
};

export type Assessment = {
  verdict: Verdict;
  reason: string;
  ingredients: IngredientAssessment[];
  aliasChips: AliasChip[];
  recognisedCount: number;
  unrecognisedCount: number;
  totalCount: number;
  recognitionRatio: number | null;
};
