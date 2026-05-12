export type PlantItem = {
  id: string;
  name: string;
  price: number;
  imageCover: string;
  category: string;
  tags: string[];
  availability: "In Stock" | "Out Of Stock" | "Up Coming";
  description: string;
  createdAt: string;
  updatedAt: string;
};
