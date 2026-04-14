"use client";

import { motion } from "framer-motion";

export function ScoreRing({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg className="-rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-white/10"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-white">{value}%</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}
