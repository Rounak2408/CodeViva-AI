"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Fingerprint,
  Gauge,
  MessageSquare,
  Briefcase,
  Shield,
  Network,
  FileDown,
  Copy,
  Share2,
  ExternalLink,
  Search,
  Bell,
  History,
  Settings,
  Sparkles,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
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
} from "recharts";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/results/score-ring";
import type { AnalysisResult } from "@/types/analysis";
import { cn } from "@/lib/utils";
import { parseJsonSafe } from "@/lib/api-response";

type ScanRow = {
  id: string;
  shareToken: string;
  isPublic: boolean;
  sourceRef: string | null;
  sourceType: string;
};

const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "originality", label: "Originality", icon: Fingerprint },
  { id: "quality", label: "Quality", icon: Gauge },
  { id: "viva", label: "Viva", icon: MessageSquare },
  { id: "interview", label: "Interview", icon: Briefcase },
  { id: "security", label: "Security", icon: Shield },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "export", label: "Export", icon: FileDown },
] as const;

type NavId = (typeof nav)[number]["id"];

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#10b981", "#38bdf8", "#f59e0b"];

function interviewCategory(question: string): string {
  const t = question.toLowerCase();
  if (/\b(scale|distributed|million|concurrent|load)\b/.test(t)) return "System Design";
  if (/\b(sql|database|postgres|mongo|redis|index)\b/.test(t)) return "DB";
  if (/\b(security|auth|jwt|oauth|xss|csrf)\b/.test(t)) return "Security";
  if (/\b(react|frontend|ui|css|dom)\b/.test(t)) return "Frontend";
  if (/\b(api|backend|server|route|endpoint)\b/.test(t)) return "Backend";
  return "General";
}

function severityStyles(sev: string) {
  const s = sev.toLowerCase();
  if (s === "critical")
    return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  if (s === "high") return "border-orange-500/25 bg-orange-500/10 text-orange-100";
  if (s === "medium")
    return "border-amber-500/25 bg-amber-500/10 text-amber-100";
  return "border-zinc-500/20 bg-zinc-500/5 text-zinc-300";
}

export function ResultsDashboard({
  scan,
  data,
}: {
  scan: ScanRow;
  data: AnalysisResult;
}) {
  const router = useRouter();
  const [section, setSection] = useState<NavId>("overview");
  const [searchQ, setSearchQ] = useState("");
  const [openViva, setOpenViva] = useState<number | null>(0);
  const [isMobile, setIsMobile] = useState(false);

  const heatColors = useMemo(
    () => data.originality.similarityHeatmap.slice(0, 12),
    [data],
  );

  const readability = Math.round(
    (data.quality.folderStructure + data.quality.namingConsistency) / 2,
  );

  const radarData = useMemo(
    () => [
      {
        subject: "Folders",
        value: data.quality.folderStructure,
        fullMark: 100,
      },
      {
        subject: "Naming",
        value: data.quality.namingConsistency,
        fullMark: 100,
      },
      {
        subject: "Readability",
        value: readability,
        fullMark: 100,
      },
      {
        subject: "Performance",
        value: data.quality.performance,
        fullMark: 100,
      },
      {
        subject: "Maintainability",
        value: data.quality.reusability,
        fullMark: 100,
      },
    ],
    [data.quality, readability],
  );

  const langPie = useMemo(() => {
    const stack = data.meta.techStack.length
      ? data.meta.techStack.slice(0, 6)
      : ["Unknown"];
    return stack.map((name, i) => ({
      name,
      value: Math.max(
        1,
        data.meta.totalFiles / (data.meta.techStack.length || 1) - i * 2,
      ),
    }));
  }, [data.meta.techStack, data.meta.totalFiles]);

  const complexityTrend = useMemo(() => {
    const c = data.meta.complexityScore;
    return [0, 1, 2, 3, 4, 5].map((i) => ({
      i: String(i),
      v: Math.max(0, Math.min(100, c + (i - 2) * 4)),
    }));
  }, [data.meta.complexityScore]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const k = e.key;
      const idx = "123456789".indexOf(k);
      if (idx >= 0 && idx < nav.length) {
        e.preventDefault();
        setSection(nav[idx]!.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  async function copyQuestion(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  async function toggleShare() {
    const res = await fetch(`/api/scan/${scan.id}/share`, { method: "POST" });
    const j = await parseJsonSafe<{
      error?: string;
      isPublic?: boolean;
      shareUrl?: string;
    }>(res);
    if (!res.ok) {
      toast.error(j.error ?? "Could not update share");
      return;
    }
    if (j.shareUrl) await navigator.clipboard.writeText(j.shareUrl);
    toast.success(j.isPublic ? "Share link copied" : "Sharing disabled");
  }

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) router.push(`/history?q=${encodeURIComponent(searchQ.trim())}`);
    else router.push("/history");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0A0D14] lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 border-r border-white/[0.06] bg-[#0A0D14] lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:w-60 lg:flex-col lg:px-3 lg:py-6">
        <div className="mb-6 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Workspace
          </p>
          <p className="mt-1 truncate font-mono text-xs text-zinc-300">
            {scan.sourceRef ?? scan.id}
          </p>
          <Badge variant="outline" className="mt-2 border-white/[0.08] text-zinc-400">
            {scan.sourceType}
          </Badge>
        </div>
        <ScrollArea className="flex-1 pr-2">
          <nav className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  section === item.id
                    ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                {section === item.id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-400 to-fuchsia-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                {item.label}
              </button>
            ))}
            <Separator className="my-3 bg-white/[0.06]" />
            <Link
              href="/history"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <History className="h-4 w-4" />
              History
            </Link>
            <Link
              href="/team"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Team
            </Link>
          </nav>
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-16 z-40 border-b border-white/[0.06] bg-[#0A0D14]/90 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <form onSubmit={onSearchSubmit} className="relative min-w-[200px] flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search scans…"
                className="h-10 rounded-xl border-white/[0.08] bg-white/[0.03] pl-9 text-sm text-white placeholder:text-zinc-600"
              />
            </form>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl text-zinc-400 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Link
                href={`/api/report/${scan.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "gradient", size: "sm" }),
                  "rounded-xl px-4",
                )}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-4 py-8 pb-24 sm:px-8 lg:pb-8">
          <div className="mx-auto max-w-5xl space-y-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {section === "overview" && (
                  <section className="space-y-8">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "AI likelihood",
                          value: data.meta.aiProbability,
                          color: "#818cf8",
                          ring: true,
                        },
                        {
                          label: "Copy similarity",
                          value: data.meta.templateSimilarity,
                          color: "#a78bfa",
                          ring: true,
                        },
                        {
                          label: "Code quality",
                          value: data.meta.codeQuality,
                          color: "#10b981",
                          ring: true,
                        },
                        {
                          label: "Project level",
                          value: data.meta.projectLevel,
                          badge: true,
                        },
                      ].map((k, i) => (
                        <motion.div
                          key={k.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="cv-surface rounded-2xl p-5"
                        >
                          {"ring" in k && k.ring ? (
                            <ScoreRing
                              label={k.label}
                              value={k.value as number}
                              color={k.color}
                            />
                          ) : (
                            <>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                {k.label}
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-white">
                                {data.meta.projectLevel}
                              </p>
                              <Badge className="mt-3 border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                                Production signals
                              </Badge>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="cv-surface rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-white">Tech stack</h3>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {data.meta.techStack.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="mt-6 h-52 min-h-[200px] w-full min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={langPie}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={72}
                                paddingAngle={2}
                              >
                                {langPie.map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  background: "#111827",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 12,
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-center text-[10px] text-zinc-500">
                          Estimated distribution by detected languages
                        </p>
                      </div>
                      <div className="cv-surface rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-white">Complexity trend</h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Relative complexity score over analysis phases
                        </p>
                        <div className="mt-4 h-52 min-h-[200px] w-full min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={complexityTrend}>
                              <defs>
                                <linearGradient id="cvArea" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="i" hide />
                              <Tooltip
                                contentStyle={{
                                  background: "#111827",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 12,
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="v"
                                stroke="#a78bfa"
                                fill="url(#cvArea)"
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="cv-surface rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-white">Summary</h3>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{data.resume}</p>
                    </div>
                  </section>
                )}

                {section === "originality" && (
                  <section className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        "Generic naming",
                        "Boilerplate structure",
                        "Repeated logic",
                        "Over-commenting",
                      ].map((label) => (
                        <div
                          key={label}
                          className="cv-surface rounded-2xl p-5 transition hover:-translate-y-0.5"
                        >
                          <p className="text-xs font-medium text-zinc-400">{label}</p>
                          <p className="mt-2 text-sm text-zinc-300">
                            Surfaced via structure + embedding similarity signals.
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="cv-surface rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-white">AI likelihood</h3>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${data.originality.aiLikelihood}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    <div className="cv-surface rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-white">Similarity heatmap</h3>
                      <div className="mt-4 h-72 min-h-[240px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={heatColors} layout="vertical">
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis
                              dataKey="file"
                              type="category"
                              width={isMobile ? 100 : 180}
                              tick={{ fill: "#a1a1aa", fontSize: 10 }}
                              tickFormatter={(val: string) =>
                                isMobile && val.length > 16 ? `${val.slice(0, 16)}…` : val
                              }
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#111827",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 12,
                              }}
                            />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {heatColors.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="cv-surface overflow-hidden rounded-2xl">
                      <div className="border-b border-white/[0.06] px-6 py-4">
                        <h3 className="text-sm font-semibold text-white">Suspicious files</h3>
                      </div>
                      <div className="divide-y divide-white/[0.06]">
                        {data.originality.suspiciousFiles.map((s) => (
                          <div key={s.path} className="flex flex-wrap items-start gap-4 px-6 py-4">
                            <code className="min-w-0 break-all font-mono text-xs text-indigo-300">{s.path}</code>
                            <span className="text-sm text-zinc-400">{s.reason}</span>
                            <Badge variant="outline" className="ml-auto border-white/10">
                              {s.score}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {section === "quality" && (
                  <section className="space-y-6">
                    <div className="cv-surface rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-white">Quality radar</h3>
                      <div className="mt-4 h-64 min-h-[240px] w-full min-w-0 sm:h-80 sm:min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#71717a" }} />
                            <Radar
                              name="Score"
                              dataKey="value"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.35}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ["Folder structure", data.quality.folderStructure],
                        ["Naming", data.quality.namingConsistency],
                        ["Readability", readability],
                        ["Performance", data.quality.performance],
                        ["Maintainability", data.quality.reusability],
                      ].map(([name, val]) => (
                        <div key={name} className="cv-surface rounded-2xl p-5">
                          <p className="text-xs text-zinc-500">{name}</p>
                          <p className="mt-2 text-3xl font-semibold text-white">{val}</p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                              style={{ width: `${val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {section === "viva" && (
                  <section className="space-y-3">
                    {data.viva.map((q, i) => {
                      const expanded = openViva === i;
                      return (
                        <div key={i} className="cv-surface overflow-hidden rounded-2xl">
                          <button
                            type="button"
                            onClick={() => setOpenViva(expanded ? null : i)}
                            className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.02]"
                          >
                            <span className="font-medium text-white">{q.question}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-zinc-500 transition",
                                expanded && "rotate-180",
                              )}
                            />
                          </button>
                          {expanded && (
                            <div className="space-y-4 border-t border-white/[0.06] px-5 pb-5 pt-2">
                              <p className="text-xs text-zinc-500">
                                Keywords:{" "}
                                <span className="text-zinc-300">{q.keywords.join(", ")}</span>
                              </p>
                              <p className="text-sm text-zinc-400">
                                <span className="text-zinc-500">Expected:</span>{" "}
                                {q.expectedAnswer}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-white/10">
                                  {q.difficulty}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/25 text-emerald-300"
                                >
                                  {q.sourceFile}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-auto rounded-lg border-white/10"
                                  onClick={() => void copyQuestion(q.question)}
                                >
                                  <Copy className="mr-1 h-3.5 w-3.5" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>
                )}

                {section === "interview" && (
                  <section className="space-y-4">
                    {data.interview.map((q, i) => {
                      const cat = interviewCategory(q.question);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="cv-surface rounded-2xl p-6"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <h3 className="font-medium text-white">{q.question}</h3>
                            <div className="flex gap-2">
                              <Badge className="border-violet-500/30 bg-violet-500/15 text-violet-200">
                                {cat}
                              </Badge>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="shrink-0"
                                onClick={() => void copyQuestion(q.question)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-zinc-500">
                            Keywords:{" "}
                            <span className="text-zinc-300">{q.keywords.join(", ")}</span>
                          </p>
                          <p className="mt-2 text-sm text-zinc-400">Expected: {q.expectedAnswer}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-white/10">
                              {q.difficulty}
                            </Badge>
                            <Badge variant="outline" className="border-emerald-500/25 text-emerald-300">
                              {q.sourceFile}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </section>
                )}

                {section === "security" && (
                  <section className="space-y-4">
                    {data.security.length === 0 ? (
                      <div className="cv-surface rounded-2xl px-8 py-16 text-center">
                        <Shield className="mx-auto h-10 w-10 text-emerald-500/80" />
                        <p className="mt-4 text-zinc-400">No security issues in this scan profile.</p>
                      </div>
                    ) : (
                      data.security.map((s, i) => (
                        <div
                          key={i}
                          className={cn(
                            "rounded-2xl border px-5 py-4",
                            severityStyles(s.severity),
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 opacity-80" />
                            <span className="font-semibold capitalize">{s.severity}</span>
                            <span className="text-white/90">· {s.category}</span>
                          </div>
                          <p className="mt-2 text-sm text-zinc-200/90">{s.detail}</p>
                          {s.file && (
                            <code className="mt-2 block font-mono text-xs text-zinc-400">
                              {s.file}
                            </code>
                          )}
                        </div>
                      ))
                    )}
                  </section>
                )}

                {section === "architecture" && (
                  <section className="space-y-6">
                    <div className="cv-surface rounded-2xl p-8">
                      <h3 className="text-sm font-semibold text-white">Flow</h3>
                      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm md:gap-6">
                        {["Frontend", "API", "Database", "Auth"].map((node, i, arr) => (
                          <div key={node} className="flex items-center gap-3">
                            <span className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-5 py-3 font-medium text-white">
                              {node}
                            </span>
                            {i < arr.length - 1 && (
                              <span className="text-zinc-600">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="cv-surface rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-white">Patterns</h3>
                      <ul className="mt-4 space-y-2">
                        {data.architecture.patterns.map((p) => (
                          <li key={p} className="flex items-center gap-2 text-sm text-zinc-300">
                            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                            {p}
                          </li>
                        ))}
                      </ul>
                      <Separator className="my-6 bg-white/[0.06]" />
                      <p className="text-sm leading-relaxed text-zinc-300">
                        {data.architecture.summary}
                      </p>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-zinc-500">Components</p>
                          <p className="mt-1 text-sm text-zinc-300">
                            {data.architecture.componentHierarchy}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">State</p>
                          <p className="mt-1 text-sm text-zinc-300">
                            {data.architecture.stateManagement}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {section === "export" && (
                  <section className="cv-surface rounded-2xl p-8">
                    <h2 className="text-lg font-semibold text-white">Export & share</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      Download a branded PDF or share a read-only link.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <a
                        href={`/api/report/${scan.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "gradient", size: "default" }),
                          "rounded-xl",
                        )}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Download PDF
                      </a>
                      <Button
                        variant="outline"
                        className="rounded-xl border-white/[0.08] bg-white/[0.03]"
                        onClick={() => void toggleShare()}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Toggle public link
                      </Button>
                      <Link
                        href={`/report/${scan.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "default" }),
                          "rounded-xl border-white/[0.08] bg-white/[0.03]",
                        )}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Report page
                      </Link>
                    </div>
                    <p className="mt-6 text-xs text-zinc-500">
                      Public share requires owner session. Link format:{" "}
                      <code className="font-mono text-zinc-400">/share/[token]</code>
                    </p>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto border-t border-white/[0.08] bg-[#0A0D14]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn(
              "flex min-w-[72px] flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium",
              section === item.id ? "text-white" : "text-zinc-500",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label.split(" ")[0]}
          </button>
        ))}
      </nav>
      <div className="h-16 lg:hidden" aria-hidden />
    </div>
  );
}
