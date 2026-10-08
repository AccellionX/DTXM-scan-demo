export type Product = {
  code: string | null;
  product_name: string;
  brands: string;
  image_front_url: string | null;
  ingredients_text: string | null;
};

export type SampleProduct = Product & {
  id: string;
  category: string;
};
