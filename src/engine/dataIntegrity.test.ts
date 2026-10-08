import { describe, expect, it } from "vitest";
import sampleProducts from "../data/sample_products.json";
import { assessProduct, assessmentData, buildAliasMap, INSUFFICIENT_REASON } from "./index";

const BANNED = /\b(safe|toxic|dangerous)\b/i;

describe("assessment tables", () => {
  it("seeds at least 40 ingredients, each with one matching rule", () => {
    expect(assessmentData.ingredients.length).toBeGreaterThanOrEqual(40);
    expect(assessmentData.rules).toHaveLength(assessmentData.ingredients.length);

    const ruleByIngredient = new Map(assessmentData.rules.map((rule) => [rule.ingredient_id, rule]));
    for (const ingredient of assessmentData.ingredients) {
      const rule = ruleByIngredient.get(ingredient.id);
      expect(rule, ingredient.id).toBeDefined();
      expect(rule?.concern).toBe(ingredient.concern);
    }
  });

  it("points every alias at an ingredient and avoids key collisions", () => {
    const ids = new Set(assessmentData.ingredients.map((item) => item.id));
    for (const alias of assessmentData.aliases) {
      expect(ids.has(alias.ingredient_id)).toBe(true);
    }
    expect(() => buildAliasMap(assessmentData.aliases)).not.toThrow();
  });

  it("includes the Parfum and SLS aliases", () => {
    const parfum = assessmentData.aliases.find((alias) => alias.alias === "parfum");
    const sls = assessmentData.aliases.find((alias) => alias.alias === "sls");
    expect(parfum?.ingredient_id).toBe("fragrance");
    expect(sls?.ingredient_id).toBe("sodium_lauryl_sulfate");
  });

  it("keeps banned words out of the illustrative copy", () => {
    const blobs = [
      ...assessmentData.ingredients.flatMap((item) => [item.name, item.note]),
      ...assessmentData.rules.flatMap((rule) => [rule.name, rule.why]),
      ...assessmentData.aliases.map((alias) => alias.alias),
      INSUFFICIENT_REASON,
    ];
    for (const blob of blobs) expect(blob).not.toMatch(BANNED);
  });
});

describe("sample products", () => {
  it("covers all four verdicts, including a missing ingredient list", () => {
    expect(sampleProducts).toHaveLength(4);
    const verdicts = sampleProducts.map((sample) => assessProduct(sample.ingredients_text).verdict);
    expect(verdicts.sort()).toEqual(["higher", "insufficient", "lower", "some"]);

    const missing = sampleProducts.find((sample) => sample.product_name === "Untitled Balm");
    const result = assessProduct(missing?.ingredients_text);
    expect(result.verdict).toBe("insufficient");
    expect(result.reason).toBe(INSUFFICIENT_REASON);
  });
});
