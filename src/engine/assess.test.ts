import { describe, expect, it } from "vitest";
import { assessIngredients, INSUFFICIENT_REASON } from "./assess";
import { assessProduct } from "./index";
import type { AssessmentData } from "./types";

const fixture: AssessmentData = {
  ingredients: [
    { id: "aqua", name: "Aqua", concern: "low", note: "Water." },
    { id: "glycerin", name: "Glycerin", concern: "low", note: "A moisture helper." },
    { id: "sles", name: "Sodium Laureth Sulfate", concern: "some", note: "A foaming cleanser." },
    { id: "sls", name: "Sodium Lauryl Sulfate", concern: "higher", note: "A strong cleanser." },
    { id: "fragrance", name: "Fragrance", concern: "some", note: "A scent blend." },
    {
      id: "caprylic",
      name: "Caprylic/Capric Triglyceride",
      concern: "low",
      note: "A light oil.",
    },
  ],
  aliases: [
    { id: "a1", alias: "aqua", ingredient_id: "aqua" },
    { id: "a2", alias: "water", ingredient_id: "aqua" },
    { id: "a3", alias: "glycerin", ingredient_id: "glycerin" },
    { id: "a4", alias: "sodium laureth sulfate", ingredient_id: "sles" },
    { id: "a5", alias: "sles", ingredient_id: "sles" },
    { id: "a6", alias: "sodium lauryl sulfate", ingredient_id: "sls" },
    { id: "a7", alias: "sls", ingredient_id: "sls" },
    { id: "a8", alias: "fragrance", ingredient_id: "fragrance" },
    { id: "a9", alias: "parfum", ingredient_id: "fragrance" },
    { id: "a10", alias: "caprylic/capric triglyceride", ingredient_id: "caprylic" },
  ],
  rules: [
    { id: "r1", ingredient_id: "aqua", concern: "low", name: "Water base", why: "Lower concern." },
    { id: "r2", ingredient_id: "glycerin", concern: "low", name: "Moisture helper", why: "Lower concern." },
    { id: "r3", ingredient_id: "sles", concern: "some", name: "Foaming cleanser", why: "Some concern." },
    { id: "r4", ingredient_id: "sls", concern: "higher", name: "Strong cleanser", why: "Higher concern." },
    { id: "r5", ingredient_id: "fragrance", concern: "some", name: "Fragrance listing", why: "Some concern." },
    { id: "r6", ingredient_id: "caprylic", concern: "low", name: "Light oil", why: "Lower concern." },
  ],
};

function verdictFor(text: string | null) {
  return assessIngredients(text, fixture).verdict;
}

describe("assessIngredients", () => {
  it("rates a higher-concern ingredient as higher concern", () => {
    const result = assessIngredients("Aqua, SLS, Glycerin", fixture);
    expect(result.verdict).toBe("higher");
    expect(result.aliasChips).toEqual([{ from: "SLS", to: "Sodium Lauryl Sulfate" }]);
    expect(result.ingredients.find((item) => item.ingredientId === "sls")?.ruleName).toBe(
      "Strong cleanser",
    );
  });

  it("rates two some-concern ingredients as some concern", () => {
    expect(verdictFor("SLES, Parfum, Aqua")).toBe("some");
  });

  it("rates a single some-concern ingredient as lower concern", () => {
    expect(verdictFor("Aqua, Parfum, Glycerin")).toBe("lower");
  });

  it("rates only lower-concern ingredients as lower concern", () => {
    expect(verdictFor("Aqua, Glycerin")).toBe("lower");
  });

  it("lets one higher-concern ingredient outweigh some-concern ones", () => {
    expect(verdictFor("SLS, SLES, Parfum, Aqua")).toBe("higher");
  });

  it("refuses a verdict when the ingredient list is missing", () => {
    for (const input of [null, undefined, "", "   "]) {
      const result = assessIngredients(input, fixture);
      expect(result.verdict).toBe("insufficient");
      expect(result.reason).toBe(INSUFFICIENT_REASON);
      expect(result.totalCount).toBe(0);
    }
  });

  it("refuses a verdict below 60% recognition, even if a higher-concern name is present", () => {
    const result = assessIngredients("SLS, Moonwax, Zeolite Dust, Fuzzle, Quiltose", fixture);
    expect(result.recognitionRatio).toBeCloseTo(0.2);
    expect(result.verdict).toBe("insufficient");
    expect(result.reason).toBe(INSUFFICIENT_REASON);
    expect(result.unrecognisedCount).toBe(4);
  });

  it("allows a verdict at exactly 60% recognition", () => {
    const result = assessIngredients("Aqua, Glycerin, Aqua, Moonwax, Quiltose", fixture);
    expect(result.recognitionRatio).toBeCloseTo(0.6);
    expect(result.verdict).toBe("lower");
  });

  it("maps Parfum to Fragrance and keeps Water as an alias of Aqua", () => {
    const result = assessIngredients("Aqua (Water), Parfum/Fragrance", fixture);
    expect(result.ingredients.map((item) => item.canonicalName)).toEqual(["Aqua", "Fragrance"]);
    expect(result.aliasChips).toEqual([
      { from: "Water", to: "Aqua" },
      { from: "Parfum", to: "Fragrance" },
    ]);
    expect(result.verdict).toBe("lower");
  });

  it("matches Caprylic/Capric Triglyceride as one ingredient", () => {
    const result = assessIngredients("Aqua, Caprylic/Capric Triglyceride, Glycerin", fixture);
    expect(result.totalCount).toBe(3);
    expect(result.recognisedCount).toBe(3);
    expect(result.ingredients[1]?.canonicalName).toBe("Caprylic/Capric Triglyceride");
    expect(result.verdict).toBe("lower");
  });

  it("uses the rule concern, not a guess, for the row", () => {
    const result = assessIngredients("sodium  lauryl   sulfate", fixture);
    expect(result.ingredients[0]).toMatchObject({
      recognised: true,
      concern: "higher",
      ruleId: "r4",
    });
  });
});

describe("seeded catalogue", () => {
  it("resolves the published alias examples", () => {
    const result = assessProduct("Parfum, SLS, Aqua");
    expect(result.verdict).toBe("higher");
    expect(result.aliasChips).toEqual([
      { from: "Parfum", to: "Fragrance" },
      { from: "SLS", to: "Sodium Lauryl Sulfate" },
    ]);
  });
});
