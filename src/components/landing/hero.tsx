"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FolderGit, Gauge, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroParticles } from "@/components/landing/hero-particles";

const floatCards = [
  { label: "AI score", value: "74%", sub: "Likelihood" },
  { label: "Quality", value: "9.1", sub: "/10" },
  { label: "Security", value: "3", sub: "alerts" },
  { label: "Viva", value: "12", sub: "questions" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[var(--cv-mesh)]" />
      <div className="pointer-events-none absolute inset-0 cv-grid-bg opacity-40" />
      <HeroParticles />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-indigo-200/90 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              </span>
              Deep scan pipeline · Embeddings + LLM
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Know If Any Codebase Is{" "}
              <span className="cv-gradient-text">Real.</span>
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
              Analyze repositories, detect originality, assess quality, and generate viva
              and interview questions in seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
              <Link
                href="/analyzer"
                className={cn(
                  buttonVariants({ size: "xl", variant: "gradient" }),
                  "inline-flex h-11 px-5 text-sm shadow-xl shadow-indigo-500/25 sm:h-12 sm:px-8 sm:text-base",
                )}
              >
                <FolderGit className="mr-2 h-4 w-4" />
                Analyze repo
              </Link>
              <Link
                href="/analyzer"
                className={cn(
                  buttonVariants({ size: "xl", variant: "outline" }),
                  "inline-flex h-11 border-white/[0.1] bg-white/[0.03] px-5 text-sm text-zinc-100 backdrop-blur hover:bg-white/[0.06] sm:h-12 sm:px-8 sm:text-base",
                )}
              >
                <Sparkles className="mr-2 h-4 w-4 text-violet-300" />
                Live demo
              </Link>
            </div>
            <Link
              href="#features"
              className="mt-10 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              Explore capabilities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
          >
            <div className="relative aspect-[4/3] rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-1 shadow-2xl shadow-black/40">
              <div className="flex h-full flex-col rounded-[1.35rem] bg-[#111827]/90 p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">Live preview</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400">
                    Scanning
                  </span>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-3">
                  {floatCards.map((c, i) => (
                    <motion.div
                      key={c.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      whileHover={{ y: -3 }}
                      className="cv-surface cv-surface-hover rounded-2xl p-4"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        {c.label}
                      </p>
                      <p className="mt-1 flex items-baseline gap-1 font-mono text-2xl font-semibold text-white">
                        {c.value}
                        <span className="text-sm font-normal text-zinc-500">{c.sub}</span>
                      </p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-zinc-400">
                  <Gauge className="h-3.5 w-3.5 text-violet-400" />
                  <span className="truncate">Embeddings + heuristics + model review</span>
                </div>
              </div>
            </div>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl"
              animate={{ opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
