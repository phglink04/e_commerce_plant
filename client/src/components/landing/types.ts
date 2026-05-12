import type { PlantProduct } from "@/types/plant";

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  icon?: string;
  productCount: number;
}

export interface BlogPreview {
  id: string;
  title: string;
  description: string;
  image: string;
  slug?: string;
}

export type { PlantProduct };
