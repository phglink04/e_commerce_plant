import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string | number;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h2>
        {subtitle !== undefined && (
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
