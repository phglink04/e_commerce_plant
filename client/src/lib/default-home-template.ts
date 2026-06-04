/**
 * DEFAULT HOME PAGE TEMPLATE
 * This captures your current homepage structure & styling
 * Used as the initial config for all new home-settings
 */

import type {
  HomeSettingsData,
  HeroConfig,
  CategoriesConfig,
  SaleConfig,
  FeaturedConfig,
  ReviewConfig,
} from "@/types/home-settings";

export const DEFAULT_HOME_TEMPLATE: HomeSettingsData = {
  logo: "/frontend/logo/logo.png",
  heroTitle: "Plant Paradise",
  heroBanner: "/frontend/Home%20Page/landingImage.webp",

  sections: [
    {
      sectionId: "hero",
      title: "Hero Section",
      isVisible: true,
      order: 1,
    },
    {
      sectionId: "categories",
      title: "Shop By Category",
      isVisible: true,
      order: 2,
    },
    {
      sectionId: "saleProducts",
      title: "Flash Sale",
      isVisible: true,
      order: 3,
    },
    {
      sectionId: "featuredProducts",
      title: "Featured Products",
      isVisible: true,
      order: 4,
    },
    {
      sectionId: "whyChooseUs",
      title: "Why Choose Us",
      isVisible: true,
      order: 5,
    },
    {
      sectionId: "blogSection",
      title: "Latest Blog Posts",
      isVisible: true,
      order: 6,
    },
    {
      sectionId: "reviewCarousel",
      title: "Customer Reviews",
      isVisible: true,
      order: 7,
    },
    {
      sectionId: "newsletter",
      title: "Newsletter Signup",
      isVisible: true,
      order: 8,
    },
  ],

  sectionConfigs: {
    // Hero - banner with tagline
    hero: {
      title: "Welcome to Plant Paradise",
      subtitle: "Discover the joy of indoor gardening",
      bannerImage: "/frontend/Home%20Page/landingImage.webp",
    } as HeroConfig,

    // Categories - grid config
    categories: {
      rows: 1,
      columns: 4,
    } as CategoriesConfig,

    // Sale Products - grid config
    saleProducts: {
      rows: 1,
      columns: 4,
    } as SaleConfig,

    // Featured Products - grid config
    featuredProducts: {
      rows: 2,
      columns: 4,
    } as FeaturedConfig,

    // Reviews - quantity config
    reviewCarousel: {
      perPage: 3,
      maxTotal: 12,
    } as ReviewConfig,
  },

  footerInfo: {
    address: "Học viện Công nghệ Bưu chính Viễn thông (PTIT), Hà Đông, Hà Nội",
    phone: "+84 (0) 123 456 789",
    email: "contact@plantworld.com",
    facebookLink: "https://facebook.com/plantworld",
  },
};

/**
 * Get section title by ID (for UI display)
 */
export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  categories: "Shop By Category",
  saleProducts: "Flash Sale",
  featuredProducts: "Featured Products",
  whyChooseUs: "Why Choose Us",
  blogSection: "Latest Blog Posts",
  reviewCarousel: "Customer Reviews",
  newsletter: "Newsletter Signup",
};

/**
 * Get section description (for admin guidance)
 */
export const SECTION_DESCRIPTIONS: Record<string, string> = {
  hero: "Banner chính với tiêu đề và ảnh nền",
  categories: "Phần duyệt theo danh mục",
  saleProducts: "Sản phẩm sale với đếm ngược",
  featuredProducts: "Sản phẩm nổi bật",
  whyChooseUs: "Phần lý do chọn chúng tôi",
  blogSection: "Bài viết blog mới nhất",
  reviewCarousel: "Đánh giá của khách hàng",
  newsletter: "Đăng ký nhận tin",
};
