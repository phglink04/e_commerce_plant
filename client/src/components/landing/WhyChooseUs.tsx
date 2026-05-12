"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Leaf, Truck, Headphones } from "lucide-react";

const features = [
  {
    id: "shipping",
    title: "Free Shipping",
    text: "On all orders above $49 with secure plant-safe packaging and real-time tracking.",
    icon: Truck,
    gradient: "from-emerald-500 to-teal-400",
    bgLight: "bg-emerald-50",
  },
  {
    id: "guarantee",
    title: "Health Guarantee",
    text: "Every plant is hand-checked before dispatch with a 30-day replacement guarantee.",
    icon: Leaf,
    gradient: "from-lime-500 to-green-400",
    bgLight: "bg-lime-50",
  },
  {
    id: "payment",
    title: "Secure Payment",
    text: "Bank-grade encrypted checkout with trusted payment gateways and fraud protection.",
    icon: ShieldCheck,
    gradient: "from-blue-500 to-cyan-400",
    bgLight: "bg-blue-50",
  },
  {
    id: "support",
    title: "24/7 Support",
    text: "Expert plant care tips and instant assistance from our dedicated support team.",
    icon: Headphones,
    gradient: "from-violet-500 to-purple-400",
    bgLight: "bg-violet-50",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden px-4 py-16 md:px-6">
      {/* ── Background decoration ── */}
      <div className="pointer-events-none absolute -left-40 top-0 h-80 w-80 rounded-full bg-emerald-100/40 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-lime-100/30 blur-[100px]" />

      <div className="mx-auto w-full max-w-[1320px]">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Why Choose Us
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Built For Plant Lovers Who
            <br className="hidden sm:block" />
            <span className="hp-gradient-text"> Expect More</span>
          </h2>
          <div className="hp-section-divider mx-auto" />
        </motion.div>

        {/* ── Feature Cards ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((item) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.id}
                variants={cardVariants}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                {/* Decorative corner gradient */}
                <div
                  className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${item.gradient} opacity-10 blur-xl transition-all duration-500 group-hover:opacity-20 group-hover:blur-2xl`}
                />

                {/* Icon */}
                <div
                  className={`relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}
                >
                  <Icon size={24} />
                  {/* Glow ring */}
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-40`}
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {item.text}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
