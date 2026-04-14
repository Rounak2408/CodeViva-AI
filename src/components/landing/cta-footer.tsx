"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaFooter() {
  return (
    <section className="bg-[#0b0f19] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent p-6 text-center shadow-2xl shadow-indigo-500/10 backdrop-blur sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.35),transparent)]" />
          <h2 className="relative text-2xl font-semibold text-white sm:text-3xl">
            Ship reviews that feel like a product, not a script
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-slate-400">
            Start a scan in under a minute. Export PDFs, share links, and keep
            teams aligned.
          </p>
          <Link
            href="/analyzer"
            className={cn(
              buttonVariants({ size: "lg", variant: "default" }),
              "relative mt-8 inline-flex h-11 rounded-xl bg-white px-6 text-sm font-medium text-slate-900 hover:bg-slate-100 sm:h-12 sm:px-8 sm:text-base",
            )}
          >
            Open analyzer
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
