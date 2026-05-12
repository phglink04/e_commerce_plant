"use client";

import type { HomeSettingsData } from "@/types/home-settings";

type HomePagePreviewProps = {
  settings: HomeSettingsData;
};

export default function HomePagePreview({ settings }: HomePagePreviewProps) {
  const visibleSections = settings.sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="w-full bg-[#fafcfa]">
      {/* Header showing preview info */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <p className="text-xs font-medium text-slate-600">
          Showing {visibleSections.length} of {settings.sections.length}{" "}
          sections
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-0">
        {visibleSections.map((section) => (
          <PreviewSection
            key={section.sectionId}
            sectionId={section.sectionId}
            title={section.title}
            config={
              settings.sectionConfigs[
                section.sectionId as keyof typeof settings.sectionConfigs
              ] as Record<string, unknown> | undefined
            }
          />
        ))}
      </div>

      {/* Footer */}
      <FooterPreview footer={settings.footerInfo} />
    </div>
  );
}

function PreviewSection({
  sectionId,
  title,
  config,
}: {
  sectionId: string;
  title: string;
  config?: Record<string, unknown>;
}) {
  const rows = (config?.rows as number) || 1;
  const columns = (config?.columns as number) || 4;
  const totalItems = rows * columns;

  return (
    <div className="px-6 py-8 border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
      {/* Section Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-1 rounded-full bg-emerald-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          {title}
        </p>
      </div>

      {/* Hero Section */}
      {sectionId === "hero" && (
        <div className="space-y-2">
          <div className="h-24 bg-gradient-to-r from-emerald-100 to-lime-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-900">
                {(config?.title as string) || "Hero Section"}
              </p>
              <p className="text-xs text-emerald-700">
                {(config?.subtitle as string) || "Subtitle"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categories Section — grid preview */}
      {sectionId === "categories" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            Shop By Category
          </p>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: totalItems }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Sale Products — grid preview */}
      {sectionId === "saleProducts" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Flash Sale</p>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: totalItems }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-2 w-3/4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products — grid preview */}
      {sectionId === "featuredProducts" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            Featured Products
          </p>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: totalItems }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-2 w-3/4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why Choose Us — static 4 items */}
      {sectionId === "whyChooseUs" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Why Choose Us</p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div className="h-8 w-8 bg-slate-200 rounded mb-2" />
                <div className="h-2 w-4/5 bg-slate-200 rounded mb-1" />
                <div className="h-1 w-full bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blog Section — static 4 items */}
      {sectionId === "blogSection" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            Latest Blog Posts
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-video bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-2 w-3/4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews — perPage items */}
      {sectionId === "reviewCarousel" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            Customer Reviews
          </p>
          <div className="flex gap-2">
            {Array.from({
              length: (config?.perPage as number) || 3,
            }).map((_, i) => (
              <div
                key={i}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div className="h-2 w-4/5 bg-slate-200 rounded mb-2" />
                <div className="h-1 w-full bg-slate-100 rounded" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">
            Tối đa {(config?.maxTotal as number) || 12} đánh giá
          </p>
        </div>
      )}

      {/* Newsletter — static */}
      {sectionId === "newsletter" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Stay Updated</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter your email"
              disabled
              className="flex-1 h-8 px-2 border border-slate-200 rounded text-xs bg-white"
            />
            <button
              disabled
              className="h-8 px-3 bg-emerald-600 text-white rounded text-xs"
            >
              Subscribe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FooterPreview({
  footer,
}: {
  footer: {
    address: string;
    phone: string;
    email: string;
    facebookLink: string;
  };
}) {
  return (
    <div className="px-6 py-6 bg-slate-900 text-white">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-semibold mb-1">📍 Location</p>
          <p className="text-slate-400 text-xs">{footer.address}</p>
        </div>
        <div>
          <p className="font-semibold mb-1">📧 Contact</p>
          <p className="text-slate-400 text-xs">{footer.email}</p>
        </div>
      </div>
    </div>
  );
}
