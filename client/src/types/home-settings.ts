/* ═══════════════════════════════════════════════════
   Home Page Builder — Configuration Types
   ═══════════════════════════════════════════════════ */

/** The unique identifier for each homepage section component */
export type HomeSectionType =
  | "hero"
  | "categories"
  | "saleProducts"
  | "featuredProducts"
  | "whyChooseUs"
  | "blogSection"
  | "reviewCarousel"
  | "newsletter";

/** Configurable properties for the Hero section */
export interface HeroConfig {
  title: string;
  subtitle: string;
  bannerImage: string;
}

/** Configurable properties for the Sale / Flash Sale section */
export interface SaleConfig {
  rows: number;
  columns: number;
  /** ISO date string for countdown end — e.g. "2026-05-10T23:59:59" */
  countdownEndDate?: string;
  /** Max discount percentage to display in the banner — e.g. 45 */
  discountPercent?: number;
}

/** Configurable properties for the Featured Products section */
export interface FeaturedConfig {
  rows: number;
  columns: number;
}

/** Configurable properties for the Categories section */
export interface CategoriesConfig {
  rows: number;
  columns: number;
}

/** Configurable properties for the Reviews section */
export interface ReviewConfig {
  perPage: number;
  maxTotal: number;
}

/** One section in the layout */
export interface SectionConfig {
  sectionId: HomeSectionType;
  title: string;
  isVisible: boolean;
  order: number;
  /** Section-specific settings stored as JSON — each section type has its own shape */
  settings?: Record<string, unknown>;
}

export interface FooterInfo {
  address: string;
  phone: string;
  email: string;
  facebookLink: string;
}

/** The complete homepage settings document */
export interface HomeSettingsData {
  logo?: string;
  heroTitle: string;
  heroBanner: string;
  sections: SectionConfig[];
  footerInfo: FooterInfo;
  /** Per-section typed config, keyed by sectionId */
  sectionConfigs: {
    hero?: HeroConfig;
    categories?: CategoriesConfig;
    saleProducts?: SaleConfig;
    featuredProducts?: FeaturedConfig;
    reviewCarousel?: ReviewConfig;
  };
}
