"use client";

import { motion } from "framer-motion";
import { TopCustomer } from "@/types/admin";
import { Users } from "lucide-react";
import React from "react";

export interface TopCustomersWidgetProps {
  loading: boolean;
  customers: TopCustomer[];
  formatCurrency: (val: number) => string;
}

export default function TopCustomersWidget({
  loading,
  customers,
  formatCurrency,
}: TopCustomersWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="flex flex-col h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Users size={16} className="text-emerald-500" />
            Top 5 khách hàng chi tiêu cao
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Nhóm đối tác khách hàng mua sắm nhiều nhất</p>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-4 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-2 w-1/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Chưa có dữ liệu khách hàng
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {customers.slice(0, 5).map((cust, idx) => {
              const initial = cust.name ? (cust.name.split(" ").pop()?.charAt(0) || "U") : "U";
              return (
                <div key={cust._id || idx} className="flex items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-100 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {cust.avatar ? (
                      <img
                        src={cust.avatar}
                        alt={cust.name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-100 shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate" title={cust.name}>
                        {cust.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5" title={cust.email}>
                        {cust.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600 tabular-nums">
                      {formatCurrency(cust.totalSpent)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{cust.orderCount} đơn hàng</p>
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
