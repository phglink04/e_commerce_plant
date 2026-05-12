"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingCart, User, X, ChevronDown } from "lucide-react";
import type { PlantProduct } from "@/components/landing/types";
import { useHomeUiStore } from "@/store/home-ui-store";
import { useAuthStore } from "@/store/auth-store";

type HeaderProps = {
  products?: PlantProduct[];
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?deal=true", label: "Deals" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const categories = [
  "All",
  "Indoor Plants",
  "Outdoor Plants",
  "Bonsai",
  "Succulents",
  "Air Purifying Plants",
];

export default function Header({ products = [] }: HeaderProps) {
  const { cartCount, recentSearches, pushRecentSearch } = useHomeUiStore();
  const { token, user, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const suggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return products
      .filter((item) => {
        const matchedCategory =
          category === "All" ||
          (item.category ?? item.tag ?? "").toLowerCase() ===
            category.toLowerCase();

        return matchedCategory && item.name.toLowerCase().includes(keyword);
      })
      .slice(0, 6);
  }, [category, products, query]);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1320px] items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 text-emerald-700 md:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Link href="/" className="group flex items-center gap-2">
            <Image
              src="/frontend/logo/logo.png"
              alt="PlantWorld"
              width={118}
              height={46}
              priority
              className="transition duration-300 group-hover:drop-shadow-[0_8px_18px_rgba(22,163,74,0.35)]"
            />
          </Link>
        </motion.div>

        <div className="relative ml-1 hidden flex-1 lg:block">
          <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="border-r border-emerald-100 px-3">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter search by category"
                className="h-10 rounded-lg bg-transparent pr-1 text-sm text-slate-700 outline-none"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <Search size={16} className="ml-3 text-emerald-500" />
            <input
              value={query}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchOpen(false), 120);
              }}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  pushRecentSearch(query);
                  setSearchOpen(false);
                }
              }}
              placeholder="Search plants"
              className="h-full w-full px-3 text-sm text-slate-700 outline-none"
            />
          </div>

          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute left-0 right-0 top-[56px] rounded-2xl border border-emerald-100 bg-white p-3 shadow-xl"
              >
                {suggestions.length > 0 ? (
                  <div className="space-y-1">
                    <p className="px-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Suggestions
                    </p>
                    {suggestions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          setQuery(item.name);
                          pushRecentSearch(item.name);
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
                      >
                        <span>{item.name}</span>
                        <span className="text-xs text-slate-500">
                          {item.category ?? item.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {recentSearches.length > 0 ? (
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recent
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 px-1">
                      {recentSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setQuery(item);
                            setSearchOpen(false);
                          }}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <nav className="ml-2 hidden items-center gap-5 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition hover:text-emerald-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
            aria-label="Cart"
          >
            <ShoppingCart size={18} />
            <motion.span
              key={cartCount}
              initial={{ scale: 0.7, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white"
            >
              {cartCount}
            </motion.span>
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Open account menu"
              title="Account menu"
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <User size={16} />
              <ChevronDown size={14} />
            </button>

            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-12 w-44 rounded-xl border border-slate-100 bg-white p-2 shadow-lg"
                >
                  {token ? (
                    <>
                      <p className="px-2 py-1 text-xs text-slate-500">
                        Hi, {user?.name ?? "Plant Lover"}
                      </p>
                      <Link
                        href="/profile"
                        className="block rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/my-orders"
                        className="block rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                      >
                        Orders
                      </Link>
                      <button
                        type="button"
                        onClick={logout}
                        className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="block rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                      >
                        Login
                      </Link>
                      <Link
                        href="/auth/register"
                        className="block rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-emerald-100 bg-white px-4 py-3 lg:hidden"
          >
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-100 px-3 py-2">
              <Search size={16} className="text-emerald-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plants"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
