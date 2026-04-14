"use client";

import { motion } from "framer-motion";
import {
  Brain,
  FileQuestion,
  Shield,
  LineChart,
  FolderGit,
  FileDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bento = [
  {
    icon: Brain,
    title: "AI detection",
    desc: "Surface boilerplate, repetition, and overly uniform structure with embeddings.",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    icon: FolderGit,
    title: "GitHub scan",
    desc: "Paste a public URL or upload a ZIP for private work.",
    className: "",
  },
  {
    icon: LineChart,
    title: "Code quality",
    desc: "Readable scores and architecture narrative stakeholders trust.",
    className: "",
  },
  {
    icon: Shield,
    title: "Security audit",
    desc: "Secrets, unsafe APIs, and validation gaps before your review.",
    className: "md:col-span-1",
  },
  {
    icon: FileQuestion,
    title: "Viva generator",
    desc: "File-grounded questions with difficulty and expected answers.",
    className: "md:col-span-1",
  },
  {
    icon: Sparkles,
    title: "Interview questions",
    desc: "Role-ready prompts grounded in the actual codebase.",
    className: "md:col-span-1",
  },
  {
    icon: FileDown,
    title: "Branded PDF",
    desc: "Export polished reports for panels and hiring packets.",
    className: "md:col-span-2",
  },
];

const logos = ["Universities", "Hiring teams", "Developers", "Bootcamps"];

export function Features() {
  return (
    <section id="features" className="border-b border-white/[0.06] bg-[#0A0D14] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything in one intelligence layer
          </h2>
          <p className="mt-3 text-pretty text-zinc-400">
            Bento-style modules — each crafted for clarity, depth, and speed.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Trusted for
          </span>
          {logos.map((name) => (
            <span
              key={name}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400"
            >
              {name}
            </span>
          ))}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bento.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className={cn(
                "group cv-surface cv-surface-hover rounded-2xl p-6 sm:p-7",
                it.className,
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/10 text-indigo-300 ring-1 ring-white/[0.08] transition group-hover:shadow-lg group-hover:shadow-indigo-500/10">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
