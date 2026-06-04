"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Leaf, Sprout, Mail, MapPin, Phone } from "lucide-react";
import api from "@/lib/api";

type FooterInfo = {
  address: string;
  phone: string;
  email: string;
  facebookLink: string;
};

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

const quickLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/shop", label: "Cửa hàng" },
  { href: "/blog", label: "Blog" },
];

const defaultFooter: FooterInfo = {
  address: "123 Bang Street, Ahmedabad",
  phone: "+91 1776438935",
  email: "info@plantworld.com",
  facebookLink: "",
};

export default function Footer() {
  const router = useRouter();
  const [footerInfo, setFooterInfo] = useState<FooterInfo>(defaultFooter);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const response = await api.get("/api/home-settings");
        const settings = response.data?.data?.settings;
        if (settings?.footerInfo) {
          setFooterInfo({
            address: settings.footerInfo.address || defaultFooter.address,
            phone: settings.footerInfo.phone || defaultFooter.phone,
            email: settings.footerInfo.email || defaultFooter.email,
            facebookLink: settings.footerInfo.facebookLink || "",
          });
        }
      } catch {
        // Keep default footer info on error
      }
    };

    void fetchFooter();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/categories?limit=50");
        const cats = (response.data?.data?.categories ?? []) as ApiCategory[];
        setCategories(cats);
      } catch {
        setCategories([]);
      }
    };

    void fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/shop?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <footer className="border-t border-emerald-100 bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-[1320px] gap-8 px-4 py-12 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <section>
          <h3 className="text-xl font-semibold">PlantWorld</h3>
          <p className="mt-3 text-sm text-slate-300">
            Lan tỏa phong cách sống xanh với cây cảnh chất lượng và trải nghiệm mua sắm hiện đại.
          </p>
          <div className="mt-4 flex gap-2">
            {footerInfo.facebookLink ? (
              <a
                href={footerInfo.facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
              >
                <Globe size={16} />
              </a>
            ) : null}
            {[Leaf, Sprout].map((Icon, idx) => (
              <a
                key={`social-${idx}`}
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">
            Liên kết nhanh
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition hover:text-emerald-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">
            Danh mục
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {categories.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleCategoryClick(item.name)}
                  className="transition hover:text-emerald-400"
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">
            Liên hệ
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-emerald-400" />
              {footerInfo.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-emerald-400" />
              {footerInfo.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-emerald-400" />
              {footerInfo.email}
            </li>
          </ul>
        </section>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-400">
        © 2026 PlantWorld. Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
