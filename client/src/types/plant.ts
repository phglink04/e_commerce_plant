export type PlantProduct = {
  _id: string;
  name: string;
  price: number;
  imageCover: string;
  category?: string;
  tags?: string[];
  availability?: string;
  rating?: number;
  discountPercentage?: number;
  shortDescription?: string;
};
