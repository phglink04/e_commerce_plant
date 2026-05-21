"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { normalizeImageSrc } from "@/utils/utils";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type FlashSaleProduct = {
  _id: string;
  name: string;
  price: number;
  imageCover: string;
  discountPercentage: number;
};

const getCountdown = (targetDate: number): Countdown => {
  const diff = Math.max(0, targetDate - Date.now());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

export default function DealsBanner() {
  const [target] = useState(() => Date.now() + 1000 * 60 * 60 * 48);
  const [countdown, setCountdown] = useState<Countdown>(() =>
    getCountdown(Date.now() + 1000 * 60 * 60 * 48),
  );
  const [flashSaleProducts, setFlashSaleProducts] = useState<FlashSaleProduct[]>([]);
  const [maxDiscount, setMaxDiscount] = useState(45);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [target]);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await api.get("/api/plants/flash-sale");
        const plants = (response.data?.data?.plants ?? []) as FlashSaleProduct[];
        setFlashSaleProducts(plants.slice(0, 3));

        if (plants.length > 0) {
          const max = Math.max(...plants.map((p) => p.discountPercentage || 0));
          if (max > 0) {
            setMaxDiscount(max);
          }
        }
      } catch {
        // Keep defaults
      }
    };

    void fetchFlashSale();
  }, []);

  return (
    <section className="px-4 py-8 md:px-6">
      <div className="mx-auto w-full max-w-[1320px] overflow-hidden rounded-3xl border border-emerald-100 bg-[radial-gradient(circle_at_20%_20%,rgba(134,239,172,0.35),transparent_45%),linear-gradient(100deg,#064e3b,#16a34a,#65a30d)] p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              Flash Sale
            </p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              Giảm Đến {maxDiscount}% Cây Cảnh HOT
            </h2>
            <p className="mt-2 max-w-xl text-sm text-emerald-50/90 md:text-base">
              Ưu đãi có thời hạn cho combo cây nội thất cao cấp, chậu thông
              minh và lựa chọn theo mùa giao nhanh.
            </p>

            {flashSaleProducts.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {flashSaleProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/shop`}
                    className="group flex min-w-[160px] items-center gap-3 rounded-xl bg-white/15 px-3 py-2 backdrop-blur transition hover:bg-white/25"
                  >
                    <Image
                      src={normalizeImageSrc(product.imageCover)}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {product.name}
                      </p>
                      <p className="text-xs text-emerald-200">
                        Giảm {product.discountPercentage}%
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              {[
                { label: "N", value: countdown.days },
                { label: "G", value: countdown.hours },
                { label: "P", value: countdown.minutes },
                { label: "S", value: countdown.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="min-w-14 rounded-xl bg-white/15 px-2 py-2 backdrop-blur"
                >
                  <p className="text-lg font-semibold">
                    {String(item.value).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-emerald-100">{item.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/shop?deal=true"
              className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Xem Ưu Đãi Ngay
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
