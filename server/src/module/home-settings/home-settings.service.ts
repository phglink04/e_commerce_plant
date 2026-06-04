import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UpdateHomeSettingsDto } from "./dto/update-home-settings.dto";
import {
  HomeSettings,
  type HomeSettingsDocument,
} from "./schemas/home-settings.schema";

@Injectable()
export class HomeSettingsService {
  constructor(
    @InjectModel(HomeSettings.name)
    private readonly settingsModel: Model<HomeSettingsDocument>,
  ) {}

  async getSettings() {
    const settings = await this.getOrCreateSettings();
    return {
      data: {
        settings: this.toResponse(settings),
      },
    };
  }

  async updateSettings(dto: UpdateHomeSettingsDto) {
    const current = await this.getOrCreateSettings();

    // Mongoose findByIdAndUpdate sẽ thay thế các fields được truyền vào.
    // Với mảng 'sections', nó sẽ replace toàn bộ mảng cũ bằng mảng mới (đúng với logic drag & drop cập nhật order)
    const updated = await this.settingsModel
      .findByIdAndUpdate(current._id, { $set: dto }, { new: true })
      .lean();

    const fallback = updated ?? current;
    return {
      message: "Home settings updated successfully",
      data: {
        settings: this.toResponse(fallback),
      },
    };
  }

  private async getOrCreateSettings() {
    const existing = await this.settingsModel.findOne().lean();
    if (existing) {
      // Sort sections by order before returning
      if (existing.sections) {
        existing.sections.sort((a, b) => a.order - b.order);
      }
      return existing;
    }

    // Default configuration lần đầu khởi chạy (match frontend section IDs)
    const created = await this.settingsModel.create({
      heroTitle: "Plant Paradise",
      heroBanner: "/frontend/Home%20Page/landingImage.webp",
      footerInfo: {
        address: "Học viện Công nghệ Bưu chính Viễn thông (PTIT), Hà Đông",
        phone: "0123456789",
        email: "contact@echomap.com",
        facebookLink: "https://facebook.com/...",
      },
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
          title: "Blog Posts",
          isVisible: true,
          order: 6,
        },
        {
          sectionId: "reviewCarousel",
          title: "Reviews",
          isVisible: true,
          order: 7,
        },
        {
          sectionId: "newsletter",
          title: "Newsletter",
          isVisible: true,
          order: 8,
        },
      ],
      sectionConfigs: {
        hero: {
          title: "Welcome to Plant Paradise",
          subtitle: "Discover indoor gardening",
          ctaText: "Start Shopping",
          ctaLink: "/shop",
          secondaryCtaText: "Learn More",
          secondaryCtaLink: "/about",
          bannerImage: "/frontend/Home%20Page/landingImage.webp",
          badge: "New Collection",
        },
        categories: {
          heading: "Shop By Category",
          subheading: "Find plants that match your style",
        },
        saleProducts: {
          heading: "Flash Sale",
          subheading: "Limited time offers",
          maxProducts: 4,
        },
        featuredProducts: {
          heading: "Featured Products",
          subheading: "Our best-selling plants",
          maxProducts: 6,
        },
        whyChooseUs: {
          heading: "Why Choose Us",
          subheading: "",
          features: [
            {
              title: "Quality Plants",
              description: "Handpicked plants from trusted growers",
            },
            {
              title: "Fast Shipping",
              description: "Secure packaging and quick delivery",
            },
            {
              title: "Expert Support",
              description: "Guidance from plant care experts",
            },
            {
              title: "Money Back",
              description: "100% satisfaction guarantee",
            },
          ],
        },
        blogSection: {
          heading: "Latest From Blog",
          subheading: "Plant care tips and inspiration",
          maxPosts: 3,
        },
        reviewCarousel: {
          heading: "What Our Customers Say",
          subheading: "Real reviews from happy plant parents",
          autoplayInterval: 5000,
        },
        newsletter: {
          heading: "Subscribe to Our Newsletter",
          subheading: "Get exclusive deals and plant tips",
          ctaText: "Subscribe",
          placeholder: "Enter your email",
        },
      },
    });

    return created.toObject();
  }

  private toResponse(settings: any) {
    return {
      logo: settings.logo ?? "/frontend/logo/logo.png",
      heroTitle: settings.heroTitle,
      heroBanner: settings.heroBanner,
      sections: settings.sections,
      sectionConfigs: settings.sectionConfigs || {},
      footerInfo: settings.footerInfo,
    };
  }
}
