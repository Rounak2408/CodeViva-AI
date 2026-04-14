"use client";

import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

const ring = [
  { name: "AI", value: 72, fill: "#818cf8" },
  { name: "Copy", value: 38, fill: "#a78bfa" },
  { name: "Quality", value: 84, fill: "#34d399" },
];

export function PreviewDashboard() {
  return (
    <section id="preview" className="border-b border-white/5 bg-[#0b0f19] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Live preview dashboard
          </h2>
          <p className="mt-3 text-slate-400">
            Animated score rings, originality heatmaps, and export-ready
            narratives — the same shell you get after every scan.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] to-[#0B0F19] p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur sm:mt-10 sm:p-8 lg:mt-12 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Score rings
              </p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="100%"
                    data={ring}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-500">Tech stack</p>
                <p className="mt-1 font-medium text-white">
                  TypeScript · Next.js · Prisma · PostgreSQL
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-500">Project level</p>
                <p className="mt-1 font-medium text-emerald-400">Industry Ready</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-500">Resume</p>
                <p className="mt-1 text-sm text-slate-300">
                  Production-grade full-stack SaaS with auth, payments-ready
                  architecture, and observability hooks.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
