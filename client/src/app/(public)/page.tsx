"use client";

import { useCallback, useEffect, useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import CategorySection from "@/components/landing/CategorySection";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import SaleProducts from "@/components/landing/SaleProducts";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import BlogSection from "@/components/landing/BlogSection";
import ReviewCarousel from "@/components/landing/ReviewCarousel";
import NewsletterSection from "@/components/landing/NewsletterSection";
import api from "@/lib/api";
import type { CategoryItem, PlantProduct } from "@/components/landing/types";
import type { HomeSettingsData, SectionConfig } from "@/types/home-settings";
import { DEFAULT_HOME_TEMPLATE } from "@/lib/default-home-template";

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

const CATEGORY_IMAGES: Record<string, string> = {
  "indoor-plants": "/frontend/ShopByCategory/image-1.jpg",
  "outdoor-plants": "/frontend/ShopByCategory/image-2.jpg",
  succulents: "/frontend/ShopByCategory/image-3.jpg",
  "flowering-plants": "/frontend/ShopByCategory/image-4.jpg",
  "foliage-plants": "/frontend/ShopByCategory/image-5.jpg",
  "climbing-plants": "/frontend/ShopByCategory/image-6.jpg",
  "herb-plants": "/frontend/ShopByCategory/image-1.jpg",
  indoor: "/frontend/ShopByCategory/indoor.png",
  outdoor: "/frontend/ShopByCategory/outdoor.png",
};

const CATEGORY_ICONS: Record<string, string> = {
  "indoor-plants": "🏠",
  "outdoor-plants": "🌳",
  succulents: "🌵",
  "flowering-plants": "🌸",
  "foliage-plants": "🌿",
  "climbing-plants": "🌱",
  "herb-plants": "🍃",
  indoor: "🏠",
  outdoor: "🌳",
};

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [, setCatalogProducts] = useState<PlantProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [homeSettings, setHomeSettings] = useState<HomeSettingsData>(
    DEFAULT_HOME_TEMPLATE,
  );

  // Fetch home settings configuration
  const fetchHomeSettings = useCallback(async () => {
    try {
      const res = await api.get("/api/home-settings");
      const settings = res.data?.data?.settings as HomeSettingsData | undefined;

      if (settings) {
        setHomeSettings(settings);
      }
    } catch (error) {
      console.error("Failed to fetch home settings:", error);
      setHomeSettings(DEFAULT_HOME_TEMPLATE);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const [catRes, plantsRes] = await Promise.all([
        api.get("/api/categories?limit=20"),
        api.get("/api/plants?limit=200"),
      ]);

      const apiCategories = (catRes.data?.data?.categories ??
        []) as ApiCategory[];
      const plants = (plantsRes.data?.data?.plants ?? []) as PlantProduct[];

      // Count products per category
      const countMap: Record<string, number> = {};
      for (const p of plants) {
        const cat = p.category ?? "Other";
        countMap[cat] = (countMap[cat] ?? 0) + 1;
      }

      const items: CategoryItem[] = apiCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        image:
          CATEGORY_IMAGES[cat.slug] ??
          CATEGORY_IMAGES[cat.name.toLowerCase()] ??
          "/frontend/ShopByCategory/image-1.jpg",
        icon:
          CATEGORY_ICONS[cat.slug] ??
          CATEGORY_ICONS[cat.name.toLowerCase()] ??
          "🌿",
        productCount: countMap[cat.name] ?? 0,
      }));

      setCategories(items);
    } catch {
      // Fallback to empty — section will simply not render
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHomeSettings();
    void fetchCategories();
  }, [fetchHomeSettings, fetchCategories]);

  // Get visible sections sorted by order
  const visibleSections = homeSettings.sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  // Render section component by ID
  const renderSection = (section: SectionConfig) => {
    const { sectionId } = section;
    const configs = homeSettings.sectionConfigs;

    switch (sectionId) {
      case "hero":
        return <HeroSection key={sectionId} config={configs.hero} />;

      case "categories":
        return !categoriesLoading && categories.length > 0 ? (
          <CategorySection
            key={sectionId}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            gridConfig={configs.categories}
          />
        ) : null;

      case "saleProducts":
        return <SaleProducts key={sectionId} gridConfig={configs.saleProducts} />;

      case "featuredProducts":
        return (
          <FeaturedProducts
            key={sectionId}
            selectedCategory={selectedCategory}
            onProductsLoaded={setCatalogProducts}
            gridConfig={configs.featuredProducts}
          />
        );

      case "whyChooseUs":
        return <WhyChooseUs key={sectionId} />;

      case "blogSection":
        return <BlogSection key={sectionId} />;

      case "reviewCarousel":
        return <ReviewCarousel key={sectionId} config={configs.reviewCarousel} />;

      case "newsletter":
        return <NewsletterSection key={sectionId} />;

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#fafcfa] text-slate-900">
      {visibleSections.map((section) => renderSection(section))}
    </main>
  );
}
