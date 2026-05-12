import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  trend?: number; // % change, positive = up, negative = down
  trendLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
};

export default function StatsCard({
  title,
  value,
  trend,
  trendLabel = "vs last month",
  icon: Icon,
  iconColor = "text-emerald-600",
  iconBg = "bg-emerald-50",
}: StatsCardProps) {
  const hasTrend = trend !== undefined;
  const isUp = hasTrend && trend > 0;
  const isDown = hasTrend && trend < 0;
  const isFlat = hasTrend && trend === 0;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Decorative blob */}
      <div
        className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 ${iconBg}`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon size={18} />
        </div>
      </div>

      {hasTrend && (
        <div className="mt-3 flex items-center gap-1.5">
          {isUp && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <TrendingUp size={11} />+{trend}%
            </span>
          )}
          {isDown && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
              <TrendingDown size={11} />
              {trend}%
            </span>
          )}
          {isFlat && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              <Minus size={11} />
              0%
            </span>
          )}
          <span className="text-xs text-slate-400">{trendLabel}</span>
        </div>
      )}
    </article>
  );
}
