export type PlantItem = {
  id: string;
  name: string;
  price: number;
  imageCover: string;
  category: string;
  tags: string[];
  availability: "In Stock" | "Out Of Stock" | "Discontinued";
  description: string;
  createdAt: string;
  updatedAt: string;
};
