export type BlogPreview = {
  id: string;
  title: string;
  description: string;
  image: string;
  slug?: string;
};

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  author: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  status?: "draft" | "published" | "archived";
  author?: string;
  isFeatured?: boolean;
  imageFile?: File | null;
}

export type UpdateBlogPayload = CreateBlogPayload;
