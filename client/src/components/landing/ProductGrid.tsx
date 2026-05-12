import Image from "next/image";
import type { HomeProduct, HomeSettings } from "@/lib/home-settings";

type ProductGridProps = {
  settings: HomeSettings;
  products: HomeProduct[];
};

const desktopColsClass: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

const clamp = (value: number) => Math.min(6, Math.max(1, value));

export default function ProductGrid({ settings, products }: ProductGridProps) {
  const cols = clamp(settings.cols);
  const rows = clamp(settings.rows);
  const maxItems = cols * rows;
  const visibleProducts = products.slice(0, maxItems);

  return (
    <section className="container space-y-4 py-8">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold text-emerald-900">{settings.heroTitle}</h2>
        <p className="text-sm text-emerald-700">
          {rows} rows x {cols} columns
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${desktopColsClass[cols]}`}
      >
        {visibleProducts.map((product) => (
          <article
            key={product._id}
            className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm"
          >
            <Image
              src={product.imageCover}
              alt={product.name}
              width={600}
              height={400}
              className="h-40 w-full object-cover"
            />
            <div className="space-y-1 p-3">
              <h3 className="line-clamp-1 text-base font-semibold text-emerald-900">
                {product.name}
              </h3>
              <p className="text-xs text-emerald-700">{product.category}</p>
              <p className="text-sm font-semibold text-emerald-800">
                {product.price} VND
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
