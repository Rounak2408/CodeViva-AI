"use client";

import { motion } from "framer-motion";
import { GitBranch, Cpu, LayoutDashboard } from "lucide-react";

const steps = [
  {
    icon: GitBranch,
    title: "Connect a repo or ZIP",
    body: "Paste a public GitHub URL or drop a ZIP — we parse languages and structure.",
  },
  {
    icon: Cpu,
    title: "Run the scan pipeline",
    body: "Embeddings + heuristics + LLM summarization produce structured insights.",
  },
  {
    icon: LayoutDashboard,
    title: "Review & export",
    body: "Dashboards, PDFs, and share links for panels and async hiring loops.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-white/5 bg-[#0b0f19] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          How it works
        </h2>
        <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur sm:p-6 lg:p-8"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                {i + 1}
              </div>
              <s.icon className="mt-5 h-6 w-6 text-violet-300" />
              <h3 className="mt-4 text-lg font-medium text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
