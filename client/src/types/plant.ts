export type PlantProduct = {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  salePrice?: number;
  imageCover: string;
  category?: string;
  tag?: string;
  tags?: string[];
  availability?: string;
  stock?: number;
  rating?: number;
  discountPercentage?: number;
  shortDescription?: string;
  description?: string;
  isFeatured?: boolean;
  isFlashSale?: boolean;
};
