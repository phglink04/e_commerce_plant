"use client";

import { motion } from "framer-motion";
import { Package, TrendingUp } from "lucide-react";
import { TopProduct } from "@/types/admin";
import React from "react";

export interface TopProductsWidgetProps {
  loading: boolean;
  products: TopProduct[];
  formatCurrency: (val: number) => string;
}

export default function TopProductsWidget({
  loading,
  products,
  formatCurrency,
}: TopProductsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-col h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-emerald-500" />
            Top 5 sản phẩm bán chạy
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Sản phẩm có lượng tiêu thụ lớn nhất tuần qua</p>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-4 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-2 w-1/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Chưa có sản phẩm bán chạy
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {products.slice(0, 5).map((item) => {
              const plant = item.product?.[0];
              return (
                <div key={item._id} className="flex items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-100 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {plant?.imageCover ? (
                      <img
                        src={plant.imageCover}
                        alt={plant.name}
                        className="h-10 w-10 rounded-lg object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                        <Package size={14} className="text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2 whitespace-normal break-words leading-tight" title={plant?.name}>
                        {plant?.name || "Sản phẩm đã xóa"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Đã bán: <span className="font-semibold text-slate-600">{item.totalSold} chậu</span></p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
