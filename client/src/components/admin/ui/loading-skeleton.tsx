import React from "react";

interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
  type?: "table" | "cards";
}

export default function LoadingSkeleton({
  rows = 5,
  cols = 5,
  type = "table",
}: LoadingSkeletonProps) {
  if (type === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="h-40 w-full rounded-xl bg-slate-100" />
            <div className="mt-4 h-5 w-2/3 rounded bg-slate-100" />
            <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
            <div className="mt-4 flex items-center justify-between">
              <div className="h-6 w-16 rounded bg-slate-100" />
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full animate-pulse space-y-4 rounded-xl border border-slate-100 bg-white p-4">
      {/* Table Header skeleton */}
      <div className="flex gap-4 border-b border-slate-100 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-5 flex-1 rounded bg-slate-100" />
        ))}
      </div>
      {/* Table Body skeleton */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-8 flex-1 rounded bg-slate-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
