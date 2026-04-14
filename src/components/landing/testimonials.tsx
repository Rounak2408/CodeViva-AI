"use client";

import { motion } from "framer-motion";

const quotes = [
  {
    quote:
      "Panels finally get consistent, file-grounded questions. The PDF alone saves us hours.",
    name: "Dr. Priya N.",
    role: "CS faculty lead",
  },
  {
    quote:
      "We use this for take-home reviews. Architecture + security in one pass is a cheat code.",
    name: "Alex R.",
    role: "Engineering manager",
  },
  {
    quote:
      "I ship better projects now — the resume blurb and weaknesses list are scarily accurate.",
    name: "Jordan L.",
    role: "Final-year student",
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-white/5 bg-[#0b0f19] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Loved by teams
        </h2>
        <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {quotes.map((q, i) => (
            <motion.blockquote
              key={q.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-[var(--cv-glass)] p-6 backdrop-blur"
            >
              <p className="text-sm leading-relaxed text-slate-300">
                <span className="text-indigo-400">“</span>
                {q.quote}
                <span className="text-indigo-400">”</span>
              </p>
              <footer className="mt-4 text-sm">
                <span className="font-medium text-white">{q.name}</span>
                <span className="text-slate-500"> · {q.role}</span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
