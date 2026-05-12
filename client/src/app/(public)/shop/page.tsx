"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, X, Grid3X3, List,
  ShoppingCart, Eye, Leaf, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Sparkles, Ban,
} from "lucide-react";
import api from "@/lib/api";
import { buildSlugAndId } from "@/lib/slug.utils";
import { useAuthStore } from "@/store/auth-store";
import { normalizeImageSrc } from "@/utils/utils";

type Plant = {
  _id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
  imageCover: string;
  category: string;
  tags: string[];
  availability: string;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
};

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

const AVAILABILITY = ["In Stock", "Out Of Stock", "Up Coming"];
const LIMIT = 12;

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function ShopPage() {
  const { token } = useAuthStore();
  const searchParams = useSearchParams();
  const isDealMode = searchParams.get("deal") === "true";

  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState<"success" | "error">("success");

  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/categories?limit=50");
        const cats = (response.data?.data?.categories ?? []) as ApiCategory[];
        setDbCategories(cats.map((c) => c.name));
      } catch {
        setDbCategories([]);
      }
    };
    void fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [minPrice, maxPrice, searchTerm, tags, selectedCategories, availability]);

  const fetchPlants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const query = new URLSearchParams();
      query.set("page", String(currentPage));
      query.set("limit", String(LIMIT));
      query.set("price[gte]", String(minPrice));
      query.set("price[lte]", String(maxPrice));
      if (searchTerm.trim()) query.set("search", searchTerm.trim());
      if (tags.length > 0) query.set("tag", tags.join(","));
      if (selectedCategories.length > 0) query.set("category", selectedCategories.join(","));
      if (availability.length > 0) query.set("availability", availability.join(","));
      if (isDealMode) query.set("deal", "true");

      const response = await api.get(`/api/plants/?${query.toString()}`);
      const items = (response.data?.data?.plants ?? []) as Plant[];
      const pages = Number(response.data?.totalPages ?? 1);
      const total = Number(response.data?.totalResults ?? items.length);
      setPlants(items);
      setTotalPages(Math.max(1, pages));
      setTotalResults(total);
    } catch {
      setError("Unable to fetch plants. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, minPrice, maxPrice, searchTerm, tags, selectedCategories, availability, isDealMode]);

  useEffect(() => { void fetchPlants(); }, [fetchPlants]);

  useEffect(() => {
    if (!cartMessage) return;
    const timer = setTimeout(() => setCartMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [cartMessage]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const toggleMultiValue = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const toggleTag = (value: string) => {
    if (value === "All") { setTags([]); return; }
    toggleMultiValue(value, tags, setTags);
  };

  const handleAddToCart = async (plant: Plant) => {
    setCartMessage("");
    if (!token) {
      setCartMessageType("error");
      setCartMessage("Please login first to add products to cart.");
      return;
    }
    try {
      await api.post("/api/users/addtocart", { plantId: plant._id, quantity: 1, price: plant.salePrice ?? plant.price }, { headers: { Authorization: `Bearer ${token}` } });
      setCartMessageType("success");
      setCartMessage(`Added "${plant.name}" to cart!`);
    } catch (err) {
      const message = typeof err === "object" && err && "response" in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to add to cart.")
        : "Failed to add to cart.";
      setCartMessageType("error");
      setCartMessage(message);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm(""); setMinPrice(0); setMaxPrice(1000000);
    setTags([]); setSelectedCategories([]); setAvailability([]);
  };

  const hasActiveFilters = searchTerm || minPrice > 0 || maxPrice < 1000000 || tags.length > 0 || selectedCategories.length > 0 || availability.length > 0;
  const activeFilterCount = (searchTerm ? 1 : 0) + (minPrice > 0 || maxPrice < 1000000 ? 1 : 0) + tags.length + selectedCategories.length + availability.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="sp">
      {/* ── Hero ── */}
      <section className="sp-hero">
        <Image src="/frontend/ShopPage/image8.png" alt="Shop banner" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <div className="sp-hero__overlay" />
        <div className="sp-hero__particles">
          {[...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              className="sp-hero__particle"
              animate={{ y: [0, -40, 0], x: [0, (i % 2 ? 15 : -15), 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
            />
          ))}
        </div>
        <motion.div className="sp-hero__content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
          <span className="sp-hero__badge"><Leaf size={14} />{isDealMode ? " Hot Deals" : " Plant Collection"}</span>
          <h1 className="sp-hero__title">{isDealMode ? "Deals & Discounts" : "Explore Our Plants"}</h1>
          <p className="sp-hero__sub">{isDealMode ? "Sản phẩm đang giảm giá — Nhanh tay kẻo hết!" : "Discover nature\u0027s finest — curated with love for your home & garden."}</p>
        </motion.div>
      </section>

      {/* ── Toast ── */}
      <AnimatePresence>
        {cartMessage && (
          <motion.div
            className={`sp-toast ${cartMessageType === "error" ? "sp-toast--error" : "sp-toast--success"}`}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
          >
            <span className="sp-toast__icon">{cartMessageType === "success" ? "✓" : "!"}</span>
            {cartMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <section className="sp-main" ref={gridRef}>
        {/* Mobile filter toggle */}
        <button className="sp-filter-toggle" onClick={() => setShowFilter((p) => !p)} type="button">
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && <span className="sp-filter-toggle__badge">{activeFilterCount}</span>}
        </button>

        <div className="sp-layout">
          {/* ── Sidebar ── */}
          <AnimatePresence>
            {(showFilter || typeof window !== "undefined") && (
              <motion.aside
                className={`sp-sidebar ${showFilter ? "sp-sidebar--open" : ""}`}
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="sp-sidebar__head">
                  <h3><SlidersHorizontal size={16} /> Filters</h3>
                  <div className="sp-sidebar__head-actions">
                    {hasActiveFilters && (
                      <button type="button" onClick={clearAllFilters} className="sp-sidebar__clear">Clear all</button>
                    )}
                    <button type="button" className="sp-sidebar__close-mobile" onClick={() => setShowFilter(false)}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label" htmlFor="sp-search">Search</label>
                  <div className="sp-search-wrap">
                    <Search className="sp-search-icon" size={15} />
                    <input id="sp-search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search plants..." className="sp-search-input" />
                  </div>
                </div>

                {/* Price */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label">Price Range (VND)</label>
                  <div className="sp-price-row">
                    <input type="number" aria-label="Minimum price" min={0} max={maxPrice} step={10000} value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value || 0))} className="sp-price-input" placeholder="Min" />
                    <span className="sp-price-sep">–</span>
                    <input type="number" aria-label="Maximum price" min={minPrice} max={1000000} step={10000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value || 1000000))} className="sp-price-input" placeholder="Max" />
                  </div>
                </div>

                {/* Tags */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label">🌞 Môi trường</label>
                  {[{ label: "All", value: "All" }, { label: "🏠 Indoor", value: "indoor" }, { label: "🏡 Outdoor", value: "outdoor" }, { label: "🌿 Shade-loving", value: "shade-loving" }, { label: "☀️ Sunlight", value: "sunlight" }].map((item) => (
                    <label key={item.value} className="sp-checkbox">
                      <input type="checkbox" checked={item.value === "All" ? tags.length === 0 : tags.includes(item.value)} onChange={() => toggleTag(item.value)} />
                      <span className="sp-checkbox__box" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="sp-filter-group">
                  <label className="sp-filter-label">💧 Chăm sóc</label>
                  {[{ label: "Easy-care", value: "easy-care" }, { label: "Low-water", value: "low-water" }, { label: "Pet-friendly", value: "pet-friendly" }].map((item) => (
                    <label key={item.value} className="sp-checkbox">
                      <input type="checkbox" checked={tags.includes(item.value)} onChange={() => toggleTag(item.value)} />
                      <span className="sp-checkbox__box" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="sp-filter-group">
                  <label className="sp-filter-label">💼 Mục đích</label>
                  {[{ label: "Office", value: "office" }, { label: "Desktop", value: "desktop" }, { label: "Living-room", value: "living-room" }, { label: "Bedroom", value: "bedroom" }, { label: "Balcony", value: "balcony" }].map((item) => (
                    <label key={item.value} className="sp-checkbox">
                      <input type="checkbox" checked={tags.includes(item.value)} onChange={() => toggleTag(item.value)} />
                      <span className="sp-checkbox__box" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Categories */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label">Categories</label>
                  {dbCategories.length > 0
                    ? dbCategories.map((item) => (
                        <label key={item} className="sp-checkbox">
                          <input type="checkbox" checked={selectedCategories.includes(item)} onChange={() => toggleMultiValue(item, selectedCategories, setSelectedCategories)} />
                          <span className="sp-checkbox__box" />
                          <span>{item}</span>
                        </label>
                      ))
                    : Array.from({ length: 4 }).map((_, i) => (
                        <div key={`cat-skel-${i}`} className="sp-skel-line pw-shimmer" />
                      ))}
                </div>

                {/* Availability */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label">Availability</label>
                  {AVAILABILITY.map((item) => (
                    <label key={item} className="sp-checkbox">
                      <input type="checkbox" checked={availability.includes(item)} onChange={() => toggleMultiValue(item, availability, setAvailability)} />
                      <span className="sp-checkbox__box" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Products Panel ── */}
          <section className="sp-products">
            {/* Toolbar */}
            {!isLoading && !error && (
              <div className="sp-toolbar">
                <p className="sp-toolbar__count">
                  <Sparkles size={14} />
                  <strong>{totalResults}</strong> product{totalResults !== 1 ? "s" : ""} found
                  {searchTerm ? <> for &quot;<em>{searchTerm}</em>&quot;</> : ""}
                </p>
                <div className="sp-toolbar__actions">
                  <div className="sp-view-toggle">
                    <button type="button" className={`sp-view-btn ${viewMode === "grid" ? "sp-view-btn--active" : ""}`} onClick={() => setViewMode("grid")} aria-label="Grid view">
                      <Grid3X3 size={16} />
                    </button>
                    <button type="button" className={`sp-view-btn ${viewMode === "list" ? "sp-view-btn--active" : ""}`} onClick={() => setViewMode("list")} aria-label="List view">
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active tags */}
            {hasActiveFilters && !isLoading && !error && (
              <div className="sp-active-tags">
                {tags.map((t) => (<span key={t} className="sp-tag" onClick={() => toggleTag(t)}>{t} <X size={12} /></span>))}
                {selectedCategories.map((c) => (<span key={c} className="sp-tag" onClick={() => toggleMultiValue(c, selectedCategories, setSelectedCategories)}>{c} <X size={12} /></span>))}
                {availability.map((a) => (<span key={a} className="sp-tag" onClick={() => toggleMultiValue(a, availability, setAvailability)}>{a} <X size={12} /></span>))}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className={`sp-grid ${viewMode === "list" ? "sp-grid--list" : ""}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <article key={`skel-${i}`} className="sp-card sp-card--skeleton">
                    <div className="sp-card__img-wrap pw-shimmer" />
                    <div className="sp-card__body">
                      <div className="sp-skel-line pw-shimmer" style={{ width: "75%" }} />
                      <div className="sp-skel-line pw-shimmer" style={{ width: "45%", marginTop: 8 }} />
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Error */}
            {!isLoading && error && (
              <div className="sp-empty">
                <div className="sp-empty__icon">⚠️</div>
                <p>{error}</p>
                <button type="button" onClick={() => void fetchPlants()} className="sp-btn sp-btn--primary">Try Again</button>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && plants.length === 0 && (
              <div className="sp-empty">
                <div className="sp-empty__icon">🌱</div>
                <h3>No plants found</h3>
                <p>Try adjusting your filters to find what you&apos;re looking for.</p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearAllFilters} className="sp-btn sp-btn--outline">Clear all filters</button>
                )}
              </div>
            )}

            {/* Products */}
            {!isLoading && !error && plants.length > 0 && (
              <div className={`sp-grid ${viewMode === "list" ? "sp-grid--list" : ""}`}>
                {plants.map((plant, i) => (
                  <motion.article key={plant._id} className={`sp-card ${viewMode === "list" ? "sp-card--list" : ""}`} custom={i} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ y: -6 }}>
                    <Link href={`/plant/${buildSlugAndId(plant.slug, plant._id)}`} className="sp-card__img-wrap">
                      <Image src={normalizeImageSrc(plant.imageCover)} alt={plant.name} width={460} height={320} loading="lazy" className="sp-card__img" />
                      <div className="sp-card__img-overlay">
                        <span className="sp-card__view-btn"><Eye size={16} /> View</span>
                      </div>
                      <div className="sp-card__badges">
                        {plant.availability && (
                          <span className={`sp-badge ${plant.availability === "In Stock" ? "sp-badge--green" : plant.availability === "Out Of Stock" ? "sp-badge--red" : "sp-badge--yellow"}`}>
                            {plant.availability}
                          </span>
                        )}
                      </div>
                      {(plant.discountPercentage ?? 0) > 0 && (
                        <span className="sp-badge sp-badge--discount">-{plant.discountPercentage}%</span>
                      )}
                    </Link>
                    <div className="sp-card__body">
                      <span className="sp-card__category">{plant.category}{plant.tags?.length > 0 ? ` · ${plant.tags[0]}` : ""}</span>
                      <h3 className="sp-card__name">
                        <Link href={`/plant/${buildSlugAndId(plant.slug, plant._id)}`}>{plant.name}</Link>
                      </h3>
                      <div className="sp-card__footer">
                        <div className="sp-card__prices">
                          {(plant.discountPercentage ?? 0) > 0 ? (
                            <>
                              <span className="sp-card__price">{(plant.salePrice ?? plant.price).toLocaleString("vi-VN")}₫</span>
                              <span className="sp-card__price-original">{plant.price.toLocaleString("vi-VN")}₫</span>
                            </>
                          ) : (
                            <span className="sp-card__price">{plant.price.toLocaleString("vi-VN")}₫</span>
                          )}
                        </div>
                        <button
                          className={`sp-cart-btn ${plant.availability === "Out Of Stock" ? "sp-cart-btn--disabled" : ""}`}
                          type="button"
                          disabled={plant.availability === "Out Of Stock"}
                          onClick={() => void handleAddToCart(plant)}
                          title={plant.availability === "Out Of Stock" ? "Sold Out" : "Add to cart"}
                        >
                          {plant.availability === "Out Of Stock" ? <Ban size={16} /> : <ShoppingCart size={16} />}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="sp-pagination">
                <button type="button" onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="sp-pg-btn"><ChevronsLeft size={16} /></button>
                <button type="button" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="sp-pg-btn"><ChevronLeft size={16} /></button>
                {pageNumbers.map((page) => (
                  <button key={page} type="button" onClick={() => handlePageChange(page)} className={`sp-pg-btn ${page === currentPage ? "sp-pg-btn--active" : ""}`}>{page}</button>
                ))}
                <button type="button" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="sp-pg-btn"><ChevronRight size={16} /></button>
                <button type="button" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="sp-pg-btn"><ChevronsRight size={16} /></button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
