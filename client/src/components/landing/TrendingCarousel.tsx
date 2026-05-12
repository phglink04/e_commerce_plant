"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { PlantProduct } from "src/types/plant";
import { normalizeImageSrc } from "@/utils/utils";

type TrendingCarouselProps = {
  items: PlantProduct[];
};

export default function TrendingCarousel({ items }: TrendingCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!viewportRef.current || items.length < 2) {
      return;
    }

    const viewport = viewportRef.current;

    const timer = window.setInterval(() => {
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      const next = viewport.scrollLeft + viewport.clientWidth * 0.66;
      viewport.scrollTo({
        left: next >= maxScrollLeft ? 0 : next,
        behavior: "smooth",
      });
    }, 3200);

    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length) {
    return null;
  }

  return (
    <section className="px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-[1320px]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Trending Now
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Most Loved By Plant Parents
        </h2>

        <div
          ref={viewportRef}
          className="no-scrollbar mt-6 flex snap-x gap-4 overflow-x-auto pb-1"
          aria-label="Trending products"
        >
          {items.map((item) => (
            <article
              key={`trending-${item._id}`}
              className="min-w-[260px] snap-start overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm md:min-w-[320px]"
            >
              <Image
                src={normalizeImageSrc(item.imageCover)}
                alt={item.name}
                width={640}
                height={420}
                loading="lazy"
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-900">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {item.category ?? item.tag ?? "Best seller"}
                </p>
                <p className="mt-3 text-lg font-semibold text-emerald-700">
                  ${item.price}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
