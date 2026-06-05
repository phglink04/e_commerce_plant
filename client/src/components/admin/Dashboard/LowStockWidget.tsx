"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Package, CheckCircle, ArrowRight } from "lucide-react";
import { LowStockProduct } from "@/types/admin";
import Link from "next/link";
import React from "react";

export interface LowStockWidgetProps {
  loading: boolean;
  products: LowStockProduct[];
}

export default function LowStockWidget({
  loading,
  products,
}: LowStockWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="flex flex-col h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
            Cảnh báo tồn kho
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Mức tồn kho sắp hết cần nhập bổ sung</p>
        </div>
        <Link
          href="/admin/plants?tab=LowStock"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
        >
          Nhập hàng
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-4 py-2">
            {[...Array(4)].map((_, i) => (
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
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <CheckCircle size={32} className="text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800">Tất cả sản phẩm đều đủ hàng 🎉</p>
            <p className="text-xs text-slate-400 mt-0.5">Không có mặt hàng nào tồn kho dưới 5.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {products.slice(0, 5).map((plant) => (
              <div key={plant._id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-rose-100 bg-rose-50/30 transition hover:bg-rose-50/50">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {plant.imageCover ? (
                    <img
                      src={plant.imageCover}
                      alt={plant.name}
                      className="h-9 w-9 rounded-lg object-cover border border-rose-200 shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center border border-rose-200 shrink-0">
                      <Package size={14} className="text-rose-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-rose-950 truncate" title={plant.name}>
                      {plant.name}
                    </p>
                    <p className="text-xs text-rose-700 truncate mt-0.5">
                      Danh mục: {plant.category}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    Tồn: {plant.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
