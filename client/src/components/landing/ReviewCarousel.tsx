"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import Image from "next/image";

const reviews = [
  {
    id: "rv-1",
    name: "Sarah K.",
    role: "Interior Designer",
    avatar: "/frontend/Feedback/testimonial1.jpg",
    rating: 5,
    text: "The quality is incredible. Packaging was secure, and every plant arrived healthy and vibrant. The care guide was a nice touch!",
  },
  {
    id: "rv-2",
    name: "Daniel M.",
    role: "Startup Founder",
    avatar: "/frontend/Feedback/testimonial2.jpeg",
    rating: 5,
    text: "Fast delivery and a sleek shopping experience. The recommendation quality feels premium. Ordered again the next week!",
  },
  {
    id: "rv-3",
    name: "Emily R.",
    role: "Plant Enthusiast",
    avatar: "/frontend/Feedback/testimonial3.jpg",
    rating: 4,
    text: "Love the care instructions and quick support. I now order monthly for my home office. Customer service is exceptional.",
  },
  {
    id: "rv-4",
    name: "Alex T.",
    role: "Home Decorator",
    avatar: "/frontend/Profile.jpg",
    rating: 5,
    text: "Best plant store I've found online. Every plant looks exactly like the photos. The 30-day guarantee gives me confidence.",
  },
  {
    id: "rv-5",
    name: "Priya S.",
    role: "Garden Hobbyist",
    avatar: "/frontend/Profile.jpg",
    rating: 5,
    text: "Amazing variety and the plants are so healthy! I've recommended this to all my friends. The subscription box is fantastic.",
  },
];

type ReviewConfig = { perPage?: number; maxTotal?: number };

export default function ReviewCarousel({ config }: { config?: ReviewConfig }) {
  const perPage = config?.perPage ?? 3;
  const maxTotal = config?.maxTotal ?? 12;
  const displayReviews = reviews.slice(0, Math.min(maxTotal, reviews.length));
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Show perPage reviews at a time for the card display
  const visibleReviews = useMemo(() => {
    const result = [];
    for (let i = 0; i < perPage; i++) {
      result.push(displayReviews[(active + i) % displayReviews.length]);
    }
    return result;
  }, [active, perPage, displayReviews]);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % displayReviews.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [paused]);

  const goTo = (direction: "prev" | "next") => {
    setActive((prev) => {
      if (direction === "prev") {
        return (prev - 1 + displayReviews.length) % displayReviews.length;
      }
      return (prev + 1) % displayReviews.length;
    });
  };

  return (
    <section className="relative overflow-hidden px-4 py-16 md:px-6">
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent" />

      <div className="relative mx-auto w-full max-w-[1320px]">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Customer Reviews
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Loved By Thousands Of
            <br className="hidden sm:block" />
            <span className="hp-gradient-text"> Plant Parents</span>
          </h2>
          <div className="hp-section-divider mx-auto" />
        </motion.div>

        {/* ── Review Cards ── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Desktop: show 3 cards */}
          <div
            className="hidden gap-5 lg:grid"
            style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}
          >
            <AnimatePresence mode="popLayout">
              {visibleReviews.map((review, idx) => (
                <motion.article
                  key={`${review.id}-${active}-${idx}`}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="hp-review-quote relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  {/* Quote decoration */}
                  <Quote
                    size={32}
                    className="mb-4 text-emerald-200"
                  />

                  {/* Stars */}
                  <div className="mb-3 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx2) => (
                      <Star
                        key={`${review.id}-star-${idx2}`}
                        size={15}
                        className={
                          idx2 < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }
                      />
                    ))}
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600">
                    &ldquo;{review.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="mt-5 flex items-center gap-3 border-t border-slate-50 pt-4">
                    <Image
                      src={review.avatar}
                      alt={review.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border-2 border-emerald-100 object-cover"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {review.name}
                      </p>
                      <p className="text-xs text-slate-400">{review.role}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {/* Mobile: single review */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              <motion.article
                key={displayReviews[active].id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="hp-review-quote relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <Quote size={28} className="mb-3 text-emerald-200" />

                <div className="mb-3 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={`mobile-star-${idx}`}
                      size={15}
                      className={
                        idx < displayReviews[active].rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }
                    />
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-slate-600">
                  &ldquo;{displayReviews[active].text}&rdquo;
                </p>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-50 pt-4">
                  <Image
                    src={displayReviews[active].avatar}
                    alt={displayReviews[active].name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full border-2 border-emerald-100 object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {displayReviews[active].name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {displayReviews[active].role}
                    </p>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goTo("prev")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Previous review"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            {displayReviews.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === active
                    ? "w-8 bg-emerald-500"
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Show review ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo("next")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Next review"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
