"use client";

import { motion } from "framer-motion";
import { GraduationCap, Briefcase, BookOpen } from "lucide-react";

const cases = [
  {
    icon: GraduationCap,
    title: "Teachers",
    body: "Fair viva questions grounded in actual files, and clarity on originality vs boilerplate.",
  },
  {
    icon: Briefcase,
    title: "Recruiters",
    body: "Interview prompts tied to the candidate’s repo, plus security and quality signals.",
  },
  {
    icon: BookOpen,
    title: "Students",
    body: "Actionable feedback on structure, resume copy, and what to improve before submission.",
  },
];

export function UseCases() {
  return (
    <section className="border-b border-white/5 bg-[#0b0f19] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Built for real workflows
        </h2>
        <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur sm:p-6 lg:p-8"
            >
              <c.icon className="h-8 w-8 text-indigo-400" />
              <h3 className="mt-4 text-lg font-medium text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
