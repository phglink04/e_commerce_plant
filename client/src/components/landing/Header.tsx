"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu, Search, ShoppingCart, User, X, ChevronDown,
  Leaf, Tag, LogOut, Settings, Package, LayoutDashboard,
  MapPin, Shield, Sparkles,
} from "lucide-react";
import { useHomeUiStore } from "@/store/home-ui-store";
import { useAuthStore } from "@/store/auth-store";
import { normalizeImageSrc } from "@/utils/utils";
import api from "@/lib/api";

/* ── Types ── */
type SearchProduct = {
  _id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
  imageCover: string;
  category: string;
  tags?: string[];
  availability?: string;
  stock?: number;
  discountPercentage?: number;
};

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

/* ── Nav Items ── */
const navItems = [
  { href: "/", label: "Trang chủ", icon: Leaf },
  { href: "/shop", label: "Cửa hàng", icon: Package },
  { href: "/shop?deal=true", label: "Ưu đãi", icon: Tag, badge: "Hot" },
  { href: "/blog", label: "Blog", icon: Sparkles },
];

export default function Header() {
  const router = useRouter();
  const { cartCount, syncCartCount, logo, fetchLogo } = useHomeUiStore();
  const { token, user, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    try {
      const [plantsRes, catRes] = await Promise.all([
        api.get("/api/plants?limit=200"),
        api.get("/api/categories?limit=50"),
      ]);
      setProducts((plantsRes.data?.data?.plants ?? []) as SearchProduct[]);
      setCategories((catRes.data?.data?.categories ?? []) as ApiCategory[]);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => { void fetchData(); void fetchLogo(); }, [fetchData, fetchLogo]);

  /* ── Sync cart count from API ── */
  useEffect(() => {
    void syncCartCount(token);
  }, [token, syncCartCount]);

  /* ── Scroll listener ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Click outside ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Keyboard shortcut Ctrl+K ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Search suggestions ── */
  const suggestions = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(kw) || (p.category ?? "").toLowerCase().includes(kw))
      .slice(0, 8);
  }, [query, products]);

  /* ── Navigate to product ── */
  const goToProduct = (p: SearchProduct) => {
    setSearchOpen(false);
    setQuery("");
    router.push(`/plant/${p.slug}-${p._id}`);
  };

  /* ── Navigate to category ── */
  const goToCategory = (catName: string) => {
    setCatOpen(false);
    setMobileOpen(false);
    router.push(`/shop?category=${encodeURIComponent(catName)}`);
  };

  /* ── Search submit ── */
  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    setQuery("");
  };

  /* ── User initials ── */
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const isAdmin = user?.role === "admin";
  const isDelivery = user?.role === "deliverypartner";

  /* ── Category icons ── */
  const catIcons: Record<string, string> = {
    indoor: "🏠", outdoor: "🌳", succulents: "🌵", bonsai: "🎋",
    "flowering-plants": "🌸", "foliage-plants": "🌿", "herb-plants": "🍃",
  };
  const getCatIcon = (slug: string) => catIcons[slug] ?? "🌱";

  /* ── Count products per category ── */
  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const c = p.category ?? "Other";
      map[c] = (map[c] ?? 0) + 1;
    }
    return map;
  }, [products]);

  return (
    <>
      <header
        className="hdr-root"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
          backdropFilter: scrolled ? "blur(24px)" : "blur(16px)",
          background: scrolled
            ? "rgba(10, 31, 25, 0.94)"
            : "rgba(10, 31, 25, 0.86)",
          borderBottom: scrolled
            ? "1px solid rgba(52, 211, 153, 0.15)"
            : "1px solid rgba(52, 211, 153, 0.08)",
          boxShadow: scrolled
            ? "0 10px 30px rgba(0, 0, 0, 0.15)"
            : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: scrolled ? "8px 20px" : "12px 20px",
            transition: "padding 0.35s ease",
          }}
        >
          {/* ── Mobile toggle ── */}
          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            className="hdr-mobile-toggle"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image
                src={normalizeImageSrc(logo)}
                alt="PlantWorld"
                width={scrolled ? 100 : 118}
                height={scrolled ? 40 : 46}
                priority
                style={{ transition: "all 0.3s ease", maxHeight: "100%", objectFit: "contain" }}
              />
            </Link>
          </motion.div>

          {/* ── Desktop Nav ── */}
          <nav className="hdr-nav">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hdr-nav-link">
                {item.label}
                {item.badge && (
                  <span className="hdr-badge-hot">{item.badge}</span>
                )}
              </Link>
            ))}

            {/* ── Categories Dropdown ── */}
            <div ref={catRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setCatOpen((p) => !p)}
                className="hdr-nav-link"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", font: "inherit" }}
              >
                Danh mục
                <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: catOpen ? "rotate(180deg)" : "rotate(0)" }} />
              </button>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="hdr-cat-dropdown"
                  >
                    <p className="hdr-cat-title">
                      <Leaf size={14} /> Danh mục sản phẩm
                    </p>
                    <div className="hdr-cat-grid">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => goToCategory(cat.name)}
                          className="hdr-cat-item"
                        >
                          <span className="hdr-cat-icon">{getCatIcon(cat.slug)}</span>
                          <div>
                            <span className="hdr-cat-name">{cat.name}</span>
                            <span className="hdr-cat-count">{catCounts[cat.name] ?? 0} sản phẩm</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8 }}>
                      <Link
                        href="/shop"
                        onClick={() => setCatOpen(false)}
                        className="hdr-cat-viewall"
                      >
                        Xem tất cả sản phẩm →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* ── Search trigger ── */}
          <button
            type="button"
            onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
            className="hdr-search-trigger"
          >
            <Search size={16} />
            <span className="hdr-search-placeholder">Tìm kiếm cây xanh...</span>
            <kbd className="hdr-search-kbd">Ctrl K</kbd>
          </button>

          {/* ── Right actions ── */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {/* Cart */}
            <Link href="/cart" className="hdr-icon-btn" aria-label="Cart">
              <ShoppingCart size={18} />
              <motion.span
                key={cartCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="hdr-cart-badge"
              >
                {cartCount}
              </motion.span>
            </Link>

            {/* Account */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen((p) => !p)}
                className="hdr-avatar-btn"
                aria-label="Account"
              >
                {token ? (
                  <span className="hdr-avatar-circle">{initials}</span>
                ) : (
                  <User size={18} />
                )}
                <ChevronDown size={13} style={{ transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "rotate(0)" }} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="hdr-user-dropdown"
                  >
                    {token ? (
                      <>
                        <div className="hdr-user-info">
                          <span className="hdr-avatar-circle hdr-avatar-lg">{initials}</span>
                          <div>
                            <p className="hdr-user-name">{user?.name ?? "Plant Lover"}</p>
                            <p className="hdr-user-email">{user?.email ?? ""}</p>
                            {isAdmin && <span className="hdr-role-badge hdr-role-admin">Quản trị viên</span>}
                            {isDelivery && <span className="hdr-role-badge hdr-role-delivery">Đối tác giao hàng</span>}
                          </div>
                        </div>
                        <div className="hdr-menu-divider" />

                        {isAdmin && (
                          <Link href="/admin" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                            <LayoutDashboard size={16} /> Admin Dashboard
                          </Link>
                        )}
                        {isDelivery && (
                          <Link href="/deliveryPartner" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                            <Package size={16} /> Delivery Workspace
                          </Link>
                        )}
                        {(isAdmin || isDelivery) && <div className="hdr-menu-divider" />}

                        <Link href="/profile" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                          <User size={16} /> Hồ sơ cá nhân
                        </Link>
                        <Link href="/profile/orders" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                          <Package size={16} /> Đơn hàng của tôi
                        </Link>
                        <Link href="/profile/addresses" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                          <MapPin size={16} /> Sổ địa chỉ
                        </Link>
                        <Link href="/profile/security" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                          <Shield size={16} /> Bảo mật
                        </Link>
                        <div className="hdr-menu-divider" />
                        <button
                          type="button"
                          onClick={() => { logout(); setMenuOpen(false); }}
                          className="hdr-menu-item hdr-menu-logout"
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ padding: "12px 16px", textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Chào mừng bạn đến PlantWorld</p>
                        </div>
                        <div className="hdr-menu-divider" />
                        <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                          <User size={16} /> Đăng nhập
                        </Link>
                        <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="hdr-menu-item">
                          <Settings size={16} /> Đăng ký
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ borderTop: "1px solid rgba(16,185,129,0.1)", background: "#fff", overflow: "hidden" }}
            >
              <div style={{ padding: "12px 16px" }}>
                {/* Mobile search */}
                <div className="hdr-mobile-search">
                  <Search size={16} style={{ color: "#10b981" }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { handleSearchSubmit(); setMobileOpen(false); } }}
                    placeholder="Tìm kiếm cây xanh..."
                    style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14 }}
                  />
                </div>

                {/* Mobile nav links */}
                <nav style={{ display: "grid", gap: 4, marginTop: 8 }}>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="hdr-mobile-link"
                    >
                      <item.icon size={16} /> {item.label}
                      {item.badge && <span className="hdr-badge-hot">{item.badge}</span>}
                    </Link>
                  ))}
                </nav>

                {/* Mobile categories */}
                {categories.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                      Danh mục
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => goToCategory(cat.name)}
                          className="hdr-mobile-cat"
                        >
                          <span>{getCatIcon(cat.slug)}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════ Search Modal Overlay ══════ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hdr-search-overlay"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="hdr-search-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="hdr-search-input-wrap">
                <Search size={20} style={{ color: "#10b981", flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
                  placeholder="Tìm kiếm cây xanh, danh mục..."
                  className="hdr-search-input"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="hdr-search-body">
                {/* Suggestions */}
                {query.trim() && suggestions.length > 0 && (
                  <div>
                    <p className="hdr-search-section-title">
                      <Sparkles size={13} /> Kết quả ({suggestions.length})
                    </p>
                    <div className="hdr-search-results">
                      {suggestions.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => goToProduct(p)}
                          className="hdr-search-result-item"
                        >
                          <Image
                            src={normalizeImageSrc(p.imageCover)}
                            alt={p.name}
                            width={56}
                            height={56}
                            className="hdr-search-thumb"
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="hdr-search-product-name">{p.name}</p>
                            <p className="hdr-search-product-cat">
                              {p.category}
                              {p.tags && p.tags.length > 0 && ` · ${p.tags[0]}`}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            {(p.discountPercentage ?? 0) > 0 ? (
                              <>
                                <p className="hdr-search-price-sale">
                                  {(p.salePrice ?? p.price).toLocaleString("vi-VN")}₫
                                </p>
                                <p className="hdr-search-price-original">
                                  {p.price.toLocaleString("vi-VN")}₫
                                </p>
                              </>
                            ) : (
                              <p className="hdr-search-price-sale">
                                {p.price.toLocaleString("vi-VN")}₫
                              </p>
                            )}
                            <span className={`hdr-search-stock ${p.availability === "In Stock" ? "hdr-stock-in" : "hdr-stock-out"}`}>
                              {p.availability === "In Stock" ? "Còn hàng" : p.availability === "Out Of Stock" ? "Hết hàng" : p.availability}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {query.trim() && suggestions.length === 0 && (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
                    <Search size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>Không tìm thấy sản phẩm nào</p>
                  </div>
                )}

                {/* Quick categories */}
                {!query.trim() && (
                  <div>
                    <p className="hdr-search-section-title">
                      <Leaf size={13} /> Danh mục phổ biến
                    </p>
                    <div className="hdr-search-cats">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { goToCategory(cat.name); setSearchOpen(false); }}
                          className="hdr-search-cat-chip"
                        >
                          {getCatIcon(cat.slug)} {cat.name}
                          <span className="hdr-search-cat-count">{catCounts[cat.name] ?? 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
