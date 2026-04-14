import { CompareClient } from "@/components/compare/compare-client";

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400/90">
          Side-by-side
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Compare repositories
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-zinc-400">
          GitHub intelligence, hiring review, and CTO-grade benchmarks — one long-form report with KPIs,
          charts, security, architecture, and viva depth.
        </p>
      </div>
      <CompareClient />
    </div>
  );
}
