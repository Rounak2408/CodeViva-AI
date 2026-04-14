"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  Trophy,
  ChevronRight,
  Shield,
  Building2,
  Briefcase,
  MessageCircleQuestion,
  Sparkles,
  Download,
  Share2,
  Bookmark,
  GitCompare,
  Target,
  LayoutGrid,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/results/score-ring";
import type { AnalysisResult } from "@/types/analysis";
import {
  buildCompareModel,
  type CompareModel,
  type KpiCard,
} from "@/lib/compare-model";
import { cn } from "@/lib/utils";

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#10b981", "#38bdf8", "#f59e0b"];

const sections = [
  { id: "kpi", label: "KPIs" },
  { id: "profiles", label: "Profiles" },
  { id: "scoreboard", label: "Scoreboard" },
  { id: "charts", label: "Charts" },
  { id: "quality", label: "Code quality" },
  { id: "architecture", label: "Architecture" },
  { id: "security", label: "Security" },
  { id: "hiring", label: "Hiring" },
  { id: "viva", label: "Viva" },
  { id: "swot", label: "SWOT" },
  { id: "recs", label: "Actions" },
] as const;

function useCountUp(target: number, duration = 900, decimals = 1) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setV(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return decimals <= 0 ? Math.round(v) : Number(v.toFixed(decimals));
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 88;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const norm = (val: number) => (max === min ? 0.5 : (val - min) / (max - min));
  const pts = data
    .map((val, i) => {
      const x = (i / Math.max(1, data.length - 1)) * w;
      const y = h - 4 - norm(val) * (h - 8);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.8" points={pts} />
    </svg>
  );
}

function KpiCardView({
  card,
  nameA,
  nameB,
}: {
  card: KpiCard;
  nameA: string;
  nameB: string;
}) {
  const deltaColor =
    card.deltaPositiveFor === "neutral"
      ? "text-zinc-400"
      : card.deltaPositiveFor === "a"
        ? "text-emerald-400/90"
        : "text-violet-300/90";

  if (card.role === "repoA") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-4 transition hover:border-indigo-400/25"
      >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.04)_50%,transparent_60%)] opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{card.label}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-3xl font-semibold tracking-tight text-white tabular-nums">
            {card.valueA}
          </span>
          <MiniSparkline data={card.sparklineA} color="#a5b4fc" />
        </div>
        <p className={cn("mt-2 text-xs", deltaColor)}>{card.delta}</p>
        <p className="mt-1 text-[10px] text-zinc-600">{nameA}</p>
      </motion.div>
    );
  }
  if (card.role === "repoB") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-violet-500/10 via-transparent to-transparent p-4 transition hover:border-violet-400/25"
      >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.04)_50%,transparent_60%)] opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{card.label}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-3xl font-semibold tracking-tight text-white tabular-nums">
            {card.valueB}
          </span>
          <MiniSparkline data={card.sparklineB} color="#c4b5fd" />
        </div>
        <p className={cn("mt-2 text-xs", deltaColor)}>{card.delta}</p>
        <p className="mt-1 text-[10px] text-zinc-600">{nameB}</p>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/15"
    >
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.03)_50%,transparent_60%)] opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{card.label}</p>
      <div className="mt-2 flex items-end justify-between gap-1">
        <div className="flex flex-col gap-0.5 text-sm tabular-nums">
          <span className="text-indigo-200/90">{nameA.split("/")[1] ?? "A"}: {card.valueA}</span>
          <span className="text-violet-200/90">{nameB.split("/")[1] ?? "B"}: {card.valueB}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <MiniSparkline data={card.sparklineA} color="#818cf8" />
          <MiniSparkline data={card.sparklineB} color="#a78bfa" />
        </div>
      </div>
      <p className={cn("mt-2 text-xs font-medium", deltaColor)}>Δ {card.delta}</p>
    </motion.div>
  );
}

function maturityBadge(m: CompareModel["profileA"]["maturity"]) {
  const map: Record<typeof m, string> = {
    Beginner: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
    Strong: "border-sky-500/30 bg-sky-500/10 text-sky-100",
    Production: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    "Startup Ready": "border-amber-500/30 bg-amber-500/10 text-amber-100",
  };
  return map[m];
}

function severityBadge(s: "Critical" | "Medium" | "Low") {
  if (s === "Critical") return "border-rose-500/35 bg-rose-500/10 text-rose-100";
  if (s === "Medium") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-zinc-500/25 bg-zinc-500/10 text-zinc-300";
}

export function CompareDashboard({
  urlA,
  urlB,
  resultA,
  resultB,
  comparisonId,
  scanAId,
  scanBId,
  onCompareAnother,
}: {
  urlA: string;
  urlB: string;
  resultA: AnalysisResult;
  resultB: AnalysisResult;
  comparisonId: string | null;
  scanAId: string | null;
  scanBId: string | null;
  onCompareAnother: () => void;
}) {
  const model = useMemo(
    () => buildCompareModel(urlA, urlB, resultA, resultB),
    [urlA, urlB, resultA, resultB],
  );

  const displayWinner = useCountUp(
    model.winner === "a" ? model.overallA : model.overallB,
    1000,
    1,
  );
  const conf = useCountUp(model.confidencePct, 1200, 0);

  const radarMerged = useMemo(
    () =>
      model.radarA.map((row, i) => ({
        subject: row.subject,
        a: row.value,
        b: model.radarB[i]?.value ?? 0,
      })),
    [model.radarA, model.radarB],
  );

  const [activeSection, setActiveSection] = useState<string>(sections[0]!.id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id.replace("section-", ""));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const s of sections) {
      const el = document.getElementById(`section-${s.id}`);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  function scrollToId(id: string) {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function shareCompare() {
    const params = new URLSearchParams({ urlA, urlB });
    const url = `${window.location.origin}/compare?${params.toString()}`;
    await navigator.clipboard.writeText(url);
    toast.success("Compare link copied (opens with URLs prefilled)");
  }

  function saveSnapshot() {
    const key = "codeviva-compare-snapshots";
    const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
    const row = {
      at: Date.now(),
      comparisonId,
      urlA,
      urlB,
      winner: model.winnerName,
    };
    localStorage.setItem(key, JSON.stringify([row, ...prev].slice(0, 20)));
    toast.success("Snapshot saved locally");
  }

  const shortA = model.repoA.display;
  const shortB = model.repoB.display;

  return (
    <div className="relative space-y-6 pb-28">
      {/* Hero metrics strip */}
      <section
        id="section-hero"
        className="cv-surface relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-300">
                Intelligence run
              </Badge>
              {comparisonId && (
                <Badge variant="outline" className="border-emerald-500/30 font-mono text-[10px] text-emerald-200/90">
                  {comparisonId.slice(0, 8)}…
                </Badge>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Executive compare
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Composite scoring across originality, quality, security, and interview readiness — built for hiring panels and technical reviewers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Repo A</p>
              <p className="mt-1 truncate font-mono text-xs text-indigo-200">{shortA}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Repo B</p>
              <p className="mt-1 truncate font-mono text-xs text-violet-200">{shortB}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Viva prompts</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-white">
                {resultA.viva.length + resultB.viva.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Security signals</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-white">
                {resultA.security.length + resultB.security.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky winner + nav */}
      <div className="sticky top-16 z-30 space-y-3">
        <motion.div
          layout
          className="cv-surface flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-4 shadow-lg shadow-amber-500/5 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-100">
                Winner: <span className="text-white">{model.winnerName}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Overall score:{" "}
                <span className="font-mono text-zinc-100 tabular-nums">
                  {displayWinner.toFixed(1)}/10
                </span>
                <span className="mx-2 text-zinc-600">·</span>
                Confidence:{" "}
                <span className="font-mono text-emerald-300/90 tabular-nums">{conf}%</span>
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                {model.winReasons.map((r) => (
                  <li key={r} className="flex items-center gap-1 text-zinc-400">
                    <span className="text-emerald-400/90">✔</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-black/30"
              onClick={() => scrollToId("scoreboard")}
            >
              View evidence
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="gradient" size="sm" onClick={() => scrollToId("charts")}>
              <BarChart3 className="mr-1 h-4 w-4" />
              Charts
            </Button>
          </div>
        </motion.div>

        <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0A0D14]/95 p-1 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToId(s.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition",
                activeSection === s.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI bento */}
      <section id="section-kpi" className="scroll-mt-36 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <LayoutGrid className="h-5 w-5 text-indigo-400" />
              KPI matrix
            </h3>
            <p className="text-sm text-zinc-500">Twelve live deltas with micro-trends (synthetic series from scan metadata).</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {model.kpiGrid.map((card) => (
            <KpiCardView key={card.id} card={card} nameA={shortA} nameB={shortB} />
          ))}
        </div>
      </section>

      {/* Repo profiles */}
      <section id="section-profiles" className="scroll-mt-36 grid gap-4 md:grid-cols-2">
        {[model.profileA, model.profileB].map((p, idx) => (
          <motion.div
            key={p.label.display}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "cv-surface rounded-3xl p-6",
              idx === 0 ? "ring-1 ring-indigo-500/15" : "ring-1 ring-violet-500/15",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Repository profile</p>
                <h4 className="mt-1 font-mono text-lg text-white">{p.label.display}</h4>
              </div>
              <Badge className={maturityBadge(p.maturity)}>{p.maturity}</Badge>
            </div>
            <Separator className="my-4 bg-white/[0.06]" />
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Owner</dt>
                <dd className="font-medium text-zinc-200">{p.owner}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Repo age (est.)</dt>
                <dd className="font-medium tabular-nums text-zinc-200">{p.repoAgeDays} days</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-zinc-500">Detected stack</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {p.stack.slice(0, 8).map((t) => (
                    <Badge key={t} variant="secondary" className="border-white/5 bg-white/5 text-[10px] font-normal">
                      {t}
                    </Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Files</dt>
                <dd className="tabular-nums text-zinc-200">{p.files}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">LOC</dt>
                <dd className="tabular-nums text-zinc-200">{p.loc.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Est. modules</dt>
                <dd className="tabular-nums text-zinc-200">{p.modulesEstimate}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Deploy readiness</dt>
                <dd className="tabular-nums text-emerald-200/90">{Math.round(p.deploymentReadiness)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Documentation</dt>
                <dd className="tabular-nums text-zinc-200">{Math.round(p.documentationScore)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Testing posture</dt>
                <dd className="tabular-nums text-zinc-200">{Math.round(p.testingScore)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Architecture style: <span className="text-zinc-300">{p.architectureStyle}</span>
            </p>
          </motion.div>
        ))}
      </section>

      {/* Scoreboard */}
      <section id="section-scoreboard" className="scroll-mt-36 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Target className="h-5 w-5 text-emerald-400" />
          Deep scoreboard
        </h3>
        <div className="cv-surface overflow-hidden rounded-3xl">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">Dimension</th>
                  <th className="px-4 py-3 font-medium text-indigo-200/90">{shortA}</th>
                  <th className="px-4 py-3 font-medium text-violet-200/90">{shortB}</th>
                  <th className="px-4 py-3 font-medium">Winner</th>
                </tr>
              </thead>
              <tbody>
                {model.scoreboard.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-2.5 text-zinc-300">{row.label}</td>
                    <td
                      className={cn(
                        "px-4 py-2.5 tabular-nums",
                        row.winner === "a" && "bg-emerald-500/10 font-medium text-emerald-100",
                        row.winner !== "a" && "text-zinc-400",
                      )}
                    >
                      {row.a.toFixed(0)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 tabular-nums",
                        row.winner === "b" && "bg-violet-500/10 font-medium text-violet-100",
                        row.winner !== "b" && "text-zinc-400",
                      )}
                    >
                      {row.b.toFixed(0)}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.winner === "tie" ? (
                        <Badge variant="outline" className="border-zinc-500/30 text-zinc-400">
                          Tie
                        </Badge>
                      ) : row.winner === "a" ? (
                        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">A</Badge>
                      ) : (
                        <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-100">B</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 p-3 md:hidden">
            {model.scoreboard.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                <p className="text-xs font-medium text-zinc-300">{row.label}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1.5">
                    <p className="text-zinc-500">{shortA}</p>
                    <p className="font-mono text-indigo-100">{row.a.toFixed(0)}</p>
                  </div>
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1.5">
                    <p className="text-zinc-500">{shortB}</p>
                    <p className="font-mono text-violet-100">{row.b.toFixed(0)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  {row.winner === "tie" ? (
                    <Badge variant="outline" className="border-zinc-500/30 text-zinc-400">
                      Tie
                    </Badge>
                  ) : row.winner === "a" ? (
                    <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">
                      Winner: {shortA}
                    </Badge>
                  ) : (
                    <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-100">
                      Winner: {shortB}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts */}
      <section id="section-charts" className="scroll-mt-36 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-sky-400" />
          Analytics deck
        </h3>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="cv-surface rounded-3xl p-4 lg:col-span-7 lg:row-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Radar</p>
            <p className="text-sm text-zinc-400">Quality · Security · Scale · Originality · UX · Maintainability</p>
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarMerged} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name={shortA} dataKey="a" stroke="#818cf8" fill="#818cf8" fillOpacity={0.25} />
                  <Radar name={shortB} dataKey="b" stroke="#c084fc" fill="#c084fc" fillOpacity={0.2} />
                  <Tooltip
                    contentStyle={{
                      background: "#111318",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="cv-surface rounded-3xl p-4 lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Language / stack donut</p>
            <div className="mt-2 grid min-h-[260px] grid-cols-1 gap-2 sm:h-[260px] sm:grid-cols-2">
              <div>
                <p className="text-center text-[10px] text-indigo-300">{shortA}</p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={model.donutA} dataKey="value" nameKey="name" innerRadius={38} outerRadius={68} paddingAngle={2}>
                      {model.donutA.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-center text-[10px] text-violet-300">{shortB}</p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={model.donutB} dataKey="value" nameKey="name" innerRadius={38} outerRadius={68} paddingAngle={2}>
                      {model.donutB.map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="cv-surface rounded-3xl p-4 lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">LOC comparison</p>
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={model.locBar} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#71717a", fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="a" fill="#6366f1" radius={[0, 4, 4, 0]} name={shortA} />
                  <Bar dataKey="b" fill="#a855f7" radius={[0, 4, 4, 0]} name={shortB} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="cv-surface rounded-3xl p-4 lg:col-span-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Complexity heat trend</p>
            <p className="text-sm text-zinc-500">Synthetic trajectory from complexity score + repo fingerprint</p>
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={model.complexityTrend}>
                  <defs>
                    <linearGradient id="ca" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" tick={{ fill: "#52525b", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="a" stroke="#818cf8" fill="url(#ca)" name={shortA} />
                  <Area type="monotone" dataKey="b" stroke="#c084fc" fill="url(#cb)" name={shortB} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="cv-surface flex flex-col items-center justify-center rounded-3xl p-6 lg:col-span-12 lg:flex-row lg:gap-16">
            <div>
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Hiring readiness gauge</p>
              <p className="text-center text-sm text-zinc-400">Modeled from viva depth, originality, and composite score</p>
            </div>
            <ScoreRing label={shortA} value={Math.round(model.hiringGaugeA)} color="#818cf8" />
            <ScoreRing label={shortB} value={Math.round(model.hiringGaugeB)} color="#c084fc" />
          </div>
        </div>
      </section>

      {/* Code quality intelligence */}
      <section id="section-quality" className="scroll-mt-36 grid gap-4 lg:grid-cols-2">
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="flex items-center gap-2 font-semibold text-indigo-200">{shortA}</h4>
          <ul className="mt-4 space-y-3">
            {model.codeIntelA.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-zinc-300">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400/80" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3">
            {[
              { label: "Modularization", v: resultA.quality.reusability },
              { label: "Naming", v: resultA.quality.namingConsistency },
              { label: "Performance", v: resultA.quality.performance },
            ].map((x) => (
              <div key={x.label}>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{x.label}</span>
                  <span className="tabular-nums text-zinc-300">{x.v}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${x.v}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="flex items-center gap-2 font-semibold text-violet-200">{shortB}</h4>
          <ul className="mt-4 space-y-3">
            {model.codeIntelB.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-zinc-300">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400/80" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3">
            {[
              { label: "Modularization", v: resultB.quality.reusability },
              { label: "Naming", v: resultB.quality.namingConsistency },
              { label: "Performance", v: resultB.quality.performance },
            ].map((x) => (
              <div key={x.label}>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{x.label}</span>
                  <span className="tabular-nums text-zinc-300">{x.v}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${x.v}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="section-architecture" className="scroll-mt-36 cv-surface rounded-3xl p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Building2 className="h-5 w-5 text-amber-400" />
          Architecture compare
        </h3>
        <p className="mt-2 text-sm text-zinc-400">{model.architectureVerdict}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="text-xs font-semibold uppercase text-indigo-300">{shortA}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
              {`Frontend → API → ${resultA.architecture.stateManagement ? "state (" + resultA.architecture.stateManagement + ")" : "state"} → persistence`}
            </pre>
            <p className="mt-3 text-xs text-zinc-500 line-clamp-4">{resultA.architecture.summary}</p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-xs font-semibold uppercase text-violet-300">{shortB}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
              {`Frontend → API → ${/ai|openai|llm|prompt/i.test(resultB.architecture.summary + resultB.architecture.patterns.join(" ")) ? "AI layer → " : ""}persistence`}
            </pre>
            <p className="mt-3 text-xs text-zinc-500 line-clamp-4">{resultB.architecture.summary}</p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="section-security" className="scroll-mt-36 grid gap-4 md:grid-cols-2">
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="flex items-center gap-2 font-semibold text-white">
            <Shield className="h-5 w-5 text-rose-400" />
            {shortA}
          </h4>
          <ul className="mt-4 space-y-2">
            {model.securityA.map((s) => (
              <li
                key={s.text}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-sm text-zinc-300"
              >
                <span>{s.positive ? "✔" : "⚠"}</span>
                <span className="flex-1">{s.text}</span>
                <Badge className={cn("text-[10px]", severityBadge(s.severity))}>{s.severity}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="flex items-center gap-2 font-semibold text-white">
            <Shield className="h-5 w-5 text-rose-400" />
            {shortB}
          </h4>
          <ul className="mt-4 space-y-2">
            {model.securityB.map((s) => (
              <li
                key={s.text}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-sm text-zinc-300"
              >
                <span>{s.positive ? "✔" : "⚠"}</span>
                <span className="flex-1">{s.text}</span>
                <Badge className={cn("text-[10px]", severityBadge(s.severity))}>{s.severity}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Hiring */}
      <section id="section-hiring" className="scroll-mt-36 cv-surface rounded-3xl p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Briefcase className="h-5 w-5 text-cyan-400" />
          Hiring & placement intelligence
        </h3>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-5">
            <p className="text-sm leading-relaxed text-zinc-300">{model.hiring.blurbA}</p>
            <p className="mt-4 text-xs font-semibold uppercase text-zinc-500">Best for</p>
            <p className="mt-1 text-sm text-emerald-200/90">{model.hiring.bestForA}</p>
            <p className="mt-4 text-xs text-zinc-500">
              Recruiter impression:{" "}
              <span className="font-mono text-lg text-white tabular-nums">{model.hiring.recruiterA.toFixed(1)}</span> / 10
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-5">
            <p className="text-sm leading-relaxed text-zinc-300">{model.hiring.blurbB}</p>
            <p className="mt-4 text-xs font-semibold uppercase text-zinc-500">Best for</p>
            <p className="mt-1 text-sm text-violet-200/90">{model.hiring.bestForB}</p>
            <p className="mt-4 text-xs text-zinc-500">
              Recruiter impression:{" "}
              <span className="font-mono text-lg text-white tabular-nums">{model.hiring.recruiterB.toFixed(1)}</span> / 10
            </p>
          </div>
        </div>
      </section>

      {/* Viva */}
      <section id="section-viva" className="scroll-mt-36 grid gap-4 lg:grid-cols-2">
        {[model.vivaA, model.vivaB].map((list, i) => (
          <div key={i} className="cv-surface rounded-3xl p-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageCircleQuestion className="h-4 w-4 text-indigo-400" />
              Viva — {i === 0 ? shortA : shortB}
            </h4>
            <ul className="mt-4 space-y-4">
              {list.map((q) => (
                <li key={q.q} className="rounded-2xl border border-white/[0.05] bg-black/25 p-4">
                  <p className="text-sm text-zinc-200">{q.q}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {q.keywords.map((k) => (
                      <Badge key={k} variant="outline" className="border-white/10 text-[10px] text-zinc-400">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* SWOT */}
      <section id="section-swot" className="scroll-mt-36 grid gap-4 lg:grid-cols-2">
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="font-semibold text-indigo-200">{shortA}</h4>
          <p className="mt-3 text-xs font-semibold uppercase text-zinc-500">Strengths</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
            {model.strengthsA.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-semibold uppercase text-zinc-500">Weaknesses</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-rose-200/80">
            {model.weaknessesA.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="font-semibold text-violet-200">{shortB}</h4>
          <p className="mt-3 text-xs font-semibold uppercase text-zinc-500">Strengths</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
            {model.strengthsB.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-semibold uppercase text-zinc-500">Weaknesses</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-rose-200/80">
            {model.weaknessesB.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recommendations */}
      <section id="section-recs" className="scroll-mt-36 grid gap-4 lg:grid-cols-2">
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="text-sm font-semibold text-white">Recommendations — {shortA}</h4>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {model.recA.map((r) => (
              <li key={r} className="flex gap-2 rounded-xl border border-white/[0.04] bg-black/20 px-3 py-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="cv-surface rounded-3xl p-6">
          <h4 className="text-sm font-semibold text-white">Recommendations — {shortB}</h4>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {model.recB.map((r) => (
              <li key={r} className="flex gap-2 rounded-xl border border-white/[0.04] bg-black/20 px-3 py-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Resume excerpts */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="cv-surface rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase text-zinc-500">Narrative — A</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{resultA.resume}</p>
        </div>
        <div className="cv-surface rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase text-zinc-500">Narrative — B</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{resultB.resume}</p>
        </div>
      </section>

      {/* Footer CTAs */}
      <footer className="z-20 mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0A0D14]/95 px-4 py-3 shadow-2xl backdrop-blur-md md:sticky md:bottom-4">
        {scanAId && (
          <a
            href={`/api/report/${scanAId}/pdf`}
            download
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10",
            )}
          >
            <Download className="mr-1 h-4 w-4" />
            PDF A
          </a>
        )}
        {scanBId && (
          <a
            href={`/api/report/${scanBId}/pdf`}
            download
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10",
            )}
          >
            <Download className="mr-1 h-4 w-4" />
            PDF B
          </a>
        )}
        <Button variant="outline" size="sm" className="border-white/10" onClick={() => void shareCompare()}>
          <Share2 className="mr-1 h-4 w-4" />
          Share link
        </Button>
        <Button variant="outline" size="sm" className="border-white/10" onClick={saveSnapshot}>
          <Bookmark className="mr-1 h-4 w-4" />
          Save snapshot
        </Button>
        <Button variant="gradient" size="sm" onClick={onCompareAnother}>
          <GitCompare className="mr-1 h-4 w-4" />
          Compare another
        </Button>
        <Link
          href="/analyzer"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          New scan
        </Link>
      </footer>
    </div>
  );
}
