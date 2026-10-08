import { describe, expect, it } from "vitest";
import { mapProduct, normaliseBarcode } from "./openBeautyFacts";

describe("normaliseBarcode", () => {
  it("keeps 8 to 14 digit barcodes and drops spaces", () => {
    expect(normaliseBarcode(" 3560070791460 ")).toBe("3560070791460");
    expect(normaliseBarcode("12345678")).toBe("12345678");
  });

  it("rejects letters and the wrong length", () => {
    expect(normaliseBarcode("abc")).toBeNull();
    expect(normaliseBarcode("1234")).toBeNull();
    expect(normaliseBarcode("")).toBeNull();
  });
});

describe("mapProduct", () => {
  it("keeps the fields the scanner shows", () => {
    expect(
      mapProduct({
        code: "3560070791460",
        product_name: " Solution dentaire ",
        brands: "Carrefour",
        image_front_url: "https://images.example/front.jpg",
        ingredients_text: "Aqua, Glycerin",
      }),
    ).toEqual({
      code: "3560070791460",
      product_name: "Solution dentaire",
      brands: "Carrefour",
      image_front_url: "https://images.example/front.jpg",
      ingredients_text: "Aqua, Glycerin",
    });
  });

  it("treats a blank ingredient list as missing", () => {
    expect(mapProduct({ product_name: "Balm", ingredients_text: "  " })?.ingredients_text).toBeNull();
  });

  it("returns null for an empty record", () => {
    expect(mapProduct({})).toBeNull();
    expect(mapProduct(null)).toBeNull();
  });
});
