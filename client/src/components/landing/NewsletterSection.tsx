"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Gift, ArrowRight } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setMessage("Thanks for subscribing! Your 10% discount code is on the way 🎉");
    setEmail("");
  };

  return (
    <section className="px-4 py-16 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 p-8 text-white shadow-xl md:p-12">
          {/* ── Decorative elements ── */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            {/* Icon */}
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Gift size={26} className="text-white" />
            </div>

            <h2 className="text-3xl font-bold md:text-4xl">
              Get 10% Off Your First Order
            </h2>
            <p className="mt-3 text-sm text-emerald-50/90 md:text-base">
              Join our newsletter for flash deals, restock alerts, and care tips
              curated by our plant experts.
            </p>

            {/* Form */}
            <form
              onSubmit={onSubmit}
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
            >
              <div className="relative flex-1 sm:max-w-sm">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-xl border-0 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-lg outline-none ring-2 ring-transparent transition focus:ring-emerald-300"
                />
              </div>
              <button
                type="submit"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
              >
                Subscribe
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            {message ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm font-medium text-emerald-100"
              >
                {message}
              </motion.p>
            ) : null}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
