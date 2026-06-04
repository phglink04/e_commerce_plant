"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
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
import { useHomeUiStore } from "@/store/home-ui-store";
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

const AVAILABILITY = ["In Stock", "Out Of Stock"];
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

function ShopPageContent() {
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

  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(50000000);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [urlSynced, setUrlSynced] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Sync URL query params → filter state (runs BEFORE first fetch) */
  useEffect(() => {
    const catParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    if (catParam) {
      setSelectedCategories([catParam]);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    setUrlSynced(true);
  }, [searchParams]);

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
      query.set("price[gte]", String(minPrice === "" ? 0 : minPrice));
      query.set("price[lte]", String(maxPrice === "" ? 50000000 : maxPrice));
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
      setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, minPrice, maxPrice, searchTerm, tags, selectedCategories, availability, isDealMode]);

  /* Only fetch after URL params have been synced to state */
  useEffect(() => { if (urlSynced) void fetchPlants(); }, [fetchPlants, urlSynced]);

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
      setCartMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }
    try {
      const response = await api.post("/api/users/addtocart", { plantId: plant._id, quantity: 1, price: plant.salePrice ?? plant.price }, { headers: { Authorization: `Bearer ${token}` } });
      // Update cart count immediately from response
      const cart = response.data?.data?.cart ?? [];
      if (cart && Array.isArray(cart)) {
        useHomeUiStore.getState().setCartCount(cart.length);
      }
      setCartMessageType("success");
      setCartMessage(`Đã thêm "${plant.name}" vào giỏ hàng!`);
    } catch (err) {
      const message = typeof err === "object" && err && "response" in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Thêm vào giỏ thất bại.")
        : "Thêm vào giỏ thất bại.";
      setCartMessageType("error");
      setCartMessage(message);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm(""); setMinPrice(0); setMaxPrice(50000000);
    setTags([]); setSelectedCategories([]); setAvailability([]);
  };

  const hasActiveFilters = searchTerm || (minPrice !== "" && minPrice > 0) || (maxPrice !== "" && maxPrice < 50000000) || tags.length > 0 || selectedCategories.length > 0 || availability.length > 0;
  const activeFilterCount = (searchTerm ? 1 : 0) + ((minPrice !== "" && minPrice > 0) || (maxPrice !== "" && maxPrice < 50000000) ? 1 : 0) + tags.length + selectedCategories.length + availability.length;

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
          <span className="sp-hero__badge"><Leaf size={14} />{isDealMode ? " Khuyến Mãi" : " Bộ Sưu Tập"}</span>
          <h1 className="sp-hero__title">{isDealMode ? "Khuyến Mãi & Giảm Giá" : "Khám Phá Cây Xanh"}</h1>
          <p className="sp-hero__sub">{isDealMode ? "Sản phẩm đang giảm giá — Nhanh tay kẻ hết!" : "Những loài cây tốt nhất — được chọn lọc cho ngôi nhà & khu vườn của bạn."}</p>
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
          Bộ lọc
          {activeFilterCount > 0 && <span className="sp-filter-toggle__badge">{activeFilterCount}</span>}
        </button>

        <div className="sp-layout">
          {/* ── Sidebar ── */}
          <AnimatePresence>
            {(showFilter || mounted) && (
              <motion.aside
                className={`sp-sidebar ${showFilter ? "sp-sidebar--open" : ""}`}
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="sp-sidebar__head">
                  <h3><SlidersHorizontal size={16} /> Bộ lọc</h3>
                  <div className="sp-sidebar__head-actions">
                    {hasActiveFilters && (
                      <button type="button" onClick={clearAllFilters} className="sp-sidebar__clear">Xóa tất cả</button>
                    )}
                    <button type="button" className="sp-sidebar__close-mobile" onClick={() => setShowFilter(false)}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label" htmlFor="sp-search">Tìm kiếm</label>
                  <div className="sp-search-wrap">
                    <Search className="sp-search-icon" size={15} />
                    <input id="sp-search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm cây xanh..." className="sp-search-input" />
                  </div>
                </div>

                {/* Price */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label">Khoảng giá (VND)</label>
                  <div className="sp-price-row">
                    <input
                      type="number"
                      aria-label="Giá tối thiểu"
                      min={0}
                      max={maxPrice === "" ? 50000000 : maxPrice}
                      step={10000}
                      value={minPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMinPrice(val === "" ? "" : Number(val));
                      }}
                      className="sp-price-input"
                      placeholder="Tối thiểu"
                    />
                    <span className="sp-price-sep">–</span>
                    <input
                      type="number"
                      aria-label="Giá tối đa"
                      min={minPrice === "" ? 0 : minPrice}
                      max={50000000}
                      step={10000}
                      value={maxPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMaxPrice(val === "" ? "" : Number(val));
                      }}
                      className="sp-price-input"
                      placeholder="Tối đa"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label">🌞 Môi trường</label>
                  {[{ label: "Tất cả", value: "All" }, { label: "🏠 Trong nhà", value: "indoor" }, { label: "🏡 Ngoài trời", value: "outdoor" }, { label: "🌿 ƪa bóng", value: "shade-loving" }, { label: "☀️ Ưa nắng", value: "sunlight" }].map((item) => (
                    <label key={item.value} className="sp-checkbox">
                      <input type="checkbox" checked={item.value === "All" ? tags.length === 0 : tags.includes(item.value)} onChange={() => toggleTag(item.value)} />
                      <span className="sp-checkbox__box" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="sp-filter-group">
                  <label className="sp-filter-label">💧 Chăm sóc</label>
                  {[{ label: "Dễ chăm", value: "easy-care" }, { label: "Ít nước", value: "low-water" }, { label: "An toàn vật nuôi", value: "pet-friendly" }].map((item) => (
                    <label key={item.value} className="sp-checkbox">
                      <input type="checkbox" checked={tags.includes(item.value)} onChange={() => toggleTag(item.value)} />
                      <span className="sp-checkbox__box" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="sp-filter-group">
                  <label className="sp-filter-label">💼 Mục đích</label>
                  {[{ label: "Văn phòng", value: "office" }, { label: "Bàn làm việc", value: "desktop" }, { label: "Phòng khách", value: "living-room" }, { label: "Phòng ngủ", value: "bedroom" }, { label: "Ban công", value: "balcony" }].map((item) => (
                    <label key={item.value} className="sp-checkbox">
                      <input type="checkbox" checked={tags.includes(item.value)} onChange={() => toggleTag(item.value)} />
                      <span className="sp-checkbox__box" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Categories */}
                <div className="sp-filter-group">
                  <label className="sp-filter-label">Danh mục</label>
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
                  <label className="sp-filter-label">Tình trạng</label>
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
                  <strong>{totalResults}</strong> sản phẩm
                  {searchTerm ? <> cho &quot;<em>{searchTerm}</em>&quot;</> : ""}
                </p>
                <div className="sp-toolbar__actions">
                  <div className="sp-view-toggle">
                    <button type="button" className={`sp-view-btn ${viewMode === "grid" ? "sp-view-btn--active" : ""}`} onClick={() => setViewMode("grid")} aria-label="Xem lưới">
                      <Grid3X3 size={18} />
                    </button>
                    <button type="button" className={`sp-view-btn ${viewMode === "list" ? "sp-view-btn--active" : ""}`} onClick={() => setViewMode("list")} aria-label="Xem danh sách">
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
                <button type="button" onClick={() => void fetchPlants()} className="sp-btn sp-btn--primary">Thử Lại</button>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && plants.length === 0 && (
              <div className="sp-empty">
                <div className="sp-empty__icon">🌱</div>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử điều chỉnh bộ lọc để tìm kiếm sản phẩm bạn muốn.</p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearAllFilters} className="sp-btn sp-btn--outline">Xóa tất cả bộ lọc</button>
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
                        <span className="sp-card__view-btn"><Eye size={16} /> Xem</span>
                      </div>
                      <div className="sp-card__badges">
                        {plant.availability && (
                          <span className={`sp-badge ${plant.availability === "In Stock" ? "sp-badge--green" : "sp-badge--red"}`}>
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
                          title={plant.availability === "Out Of Stock" ? "Hết hàng" : "Thêm vào giỏ"}
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center text-slate-500">Đang tải cửa hàng...</div>}>
      <ShopPageContent />
    </Suspense>
  );
}
