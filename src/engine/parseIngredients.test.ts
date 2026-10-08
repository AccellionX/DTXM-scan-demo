import { describe, expect, it } from "vitest";
import { parseIngredientsText } from "./parseIngredients";

describe("parseIngredientsText", () => {
  it("returns nothing when the list is missing or blank", () => {
    expect(parseIngredientsText(null)).toEqual([]);
    expect(parseIngredientsText(undefined)).toEqual([]);
    expect(parseIngredientsText("")).toEqual([]);
    expect(parseIngredientsText("   ")).toEqual([]);
    expect(parseIngredientsText("***")).toEqual([]);
  });

  it("splits on commas, trims spaces, and keeps the printed case", () => {
    expect(parseIngredientsText("  aQuA ,   GLYCERIN  ")).toEqual([
      { label: "aQuA", synonyms: [] },
      { label: "GLYCERIN", synonyms: [] },
    ]);
  });

  it("drops asterisks used as footnote marks", () => {
    expect(parseIngredientsText("Glycerin*, Aqua**")).toEqual([
      { label: "Glycerin", synonyms: [] },
      { label: "Aqua", synonyms: [] },
    ]);
  });

  it("keeps a bracketed synonym on the same ingredient", () => {
    expect(parseIngredientsText("Aqua (Water), Glycerin")).toEqual([
      { label: "Aqua", synonyms: ["Water"] },
      { label: "Glycerin", synonyms: [] },
    ]);
  });

  it("treats a comma-separated bracket list as extra ingredients", () => {
    expect(parseIngredientsText("Fragrance (Limonene, Linalool), Aqua")).toEqual([
      { label: "Fragrance", synonyms: [] },
      { label: "Limonene", synonyms: [] },
      { label: "Linalool", synonyms: [] },
      { label: "Aqua", synonyms: [] },
    ]);
  });

  it("keeps slash names together and also offers each side", () => {
    expect(parseIngredientsText("Parfum/Fragrance")).toEqual([
      { label: "Parfum/Fragrance", synonyms: ["Parfum", "Fragrance"] },
    ]);
    expect(parseIngredientsText("Caprylic/Capric Triglyceride")).toEqual([
      {
        label: "Caprylic/Capric Triglyceride",
        synonyms: ["Caprylic", "Capric Triglyceride"],
      },
    ]);
  });

  it("does not split commas that sit inside brackets", () => {
    expect(parseIngredientsText("CI 77891 (Titanium Dioxide), Glycerin")).toEqual([
      { label: "CI 77891", synonyms: ["Titanium Dioxide"] },
      { label: "Glycerin", synonyms: [] },
    ]);
  });
});
