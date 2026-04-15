"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  FolderGit,
  Loader2,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { defaultScanOptions, type ScanOptions } from "@/types/analysis";
import { cn } from "@/lib/utils";
import { parseJsonSafe } from "@/lib/api-response";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const SCAN_STAGES = [
  "Fetching repository…",
  "Parsing architecture…",
  "Detecting AI patterns…",
  "Reviewing quality…",
  "Generating questions…",
  "Finalizing report…",
] as const;

type Props = { defaultTab: "github" | "upload" };

export function AnalyzerClient({ defaultTab }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(defaultTab);
  const [githubUrl, setGithubUrl] = useState("https://github.com/vercel/swr");
  const [ufsUrl, setUfsUrl] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [options, setOptions] = useState<ScanOptions>(defaultScanOptions);
  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [hasGithubToken, setHasGithubToken] = useState<boolean | null>(null);
  const [hasOpenAiKey, setHasOpenAiKey] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) return;
    setStageIdx(0);
    const id = window.setInterval(() => {
      setStageIdx((s) => Math.min(s + 1, SCAN_STAGES.length - 1));
    }, 2200);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    let alive = true;
    const loadFlags = async () => {
      try {
        const res = await fetch("/api/runtime/flags", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          hasGithubToken?: boolean;
          hasOpenAiKey?: boolean;
          fastScanDefault?: boolean;
        };
        if (!alive) return;
        setHasGithubToken(Boolean(data.hasGithubToken));
        setHasOpenAiKey(Boolean(data.hasOpenAiKey));
        const fastScanDefault = data.fastScanDefault;
        if (typeof fastScanDefault === "boolean") {
          setOptions((prev) => ({ ...prev, fastMode: fastScanDefault }));
        }
      } catch {
        if (alive) {
          setHasGithubToken(null);
          setHasOpenAiKey(null);
        }
      }
    };
    void loadFlags();
    return () => {
      alive = false;
    };
  }, []);

  const runGithub = useCallback(async () => {
    setLoading(true);
    setStageIdx(0);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "github",
          githubUrl,
          options,
        }),
      });
      const data = await parseJsonSafe<{
        scanId?: string;
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      toast.success("Scan complete");
      router.push(`/results/${data.scanId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }, [githubUrl, options, router]);

  const runZipJson = useCallback(async () => {
    if (!ufsUrl) {
      toast.error("Upload a ZIP first, or drop a file below.");
      return;
    }
    setLoading(true);
    setStageIdx(0);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "zip",
          ufsUrl,
          fileName: uploadName ?? "upload.zip",
          options,
        }),
      });
      const data = await parseJsonSafe<{
        scanId?: string;
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      toast.success("Scan complete");
      router.push(`/results/${data.scanId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }, [ufsUrl, uploadName, options, router]);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file?.name.toLowerCase().endsWith(".zip")) {
        toast.error("Please drop a .zip file");
        return;
      }
      setLoading(true);
      setStageIdx(0);
      try {
        const fd = new FormData();
        fd.append("zip", file);
        fd.append("options", JSON.stringify(options));
        const res = await fetch("/api/scan", {
          method: "POST",
          body: fd,
        });
        const data = await parseJsonSafe<{
          scanId?: string;
          error?: string;
        }>(res);
        if (!res.ok) throw new Error(data.error ?? "Scan failed");
        toast.success("Scan complete");
        router.push(`/results/${data.scanId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Scan failed");
      } finally {
        setLoading(false);
      }
    },
    [options, router],
  );

  return (
    <>
      <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-indigo-200/90">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Analyzer console
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ship-grade scans in one flow
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-pretty text-zinc-400">
            GitHub URL or ZIP — embeddings, heuristics, and model review in a single pass.
          </p>
        </motion.div>

        <motion.div
          layout
          className="relative mt-12 overflow-hidden rounded-3xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-1 shadow-2xl shadow-black/40 backdrop-blur-2xl"
        >
          <div className="rounded-[1.35rem] bg-[#111827]/80 p-6 sm:p-8">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "github" | "upload")}>
              <TabsList className="grid h-12 w-full grid-cols-2 gap-1 rounded-xl bg-black/30 p-1">
                <TabsTrigger
                  value="github"
                  className="gap-2 rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                >
                  <FolderGit className="h-4 w-4" />
                  GitHub repo
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="gap-2 rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                >
                  <Upload className="h-4 w-4" />
                  ZIP upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="github" className="mt-8 space-y-4">
                <Label htmlFor="url" className="text-sm text-zinc-300">
                  Repository URL
                </Label>
                <div className="relative">
                  <FolderGit className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="h-12 rounded-xl border-white/[0.08] bg-black/25 pl-10 font-mono text-sm text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
                  />
                </div>
                {hasGithubToken === false && (
                  <p className="text-xs text-amber-400/90">
                    No <code className="rounded bg-white/5 px-1">GITHUB_TOKEN</code> on server —
                    large repos may be slower; ZIP is most reliable.
                  </p>
                )}
                {hasOpenAiKey === false && (
                  <p className="text-xs text-amber-300/90">
                    No <code className="rounded bg-white/5 px-1">OPENAI_API_KEY</code> on server —
                    scan will run in fallback mode.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-8 space-y-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className={cn(
                    "group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.12] bg-black/20 px-4 py-12 text-center transition",
                    "hover:border-indigo-400/35 hover:bg-white/[0.02]",
                  )}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5" />
                  </div>
                  <Upload className="relative h-10 w-10 text-indigo-400" />
                  <p className="relative mt-4 text-sm font-medium text-zinc-200">
                    Drop a .zip archive here
                  </p>
                  <p className="relative mt-1 text-xs text-zinc-500">
                    Or upload via the button — analyzed securely on your stack.
                  </p>
                  <div className="relative mt-6 ut-button-wrapper">
                    <UploadButton<OurFileRouter, "zipUploader">
                      endpoint="zipUploader"
                      onClientUploadComplete={(res) => {
                        const f = res[0];
                        if (f?.ufsUrl) {
                          setUfsUrl(f.ufsUrl);
                          setUploadName(f.name);
                          toast.success("Ready to analyze");
                        }
                      }}
                      onUploadError={(e) => {
                        toast.error(e.message);
                      }}
                      appearance={{
                        button:
                          "ut-ready:bg-gradient-to-r ut-ready:from-indigo-500 ut-ready:via-violet-500 ut-ready:to-fuchsia-500 ut-ready:text-white ut-uploading:cursor-not-allowed rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/20",
                        allowedContent: "text-zinc-500 text-xs",
                      }}
                    />
                  </div>
                  {ufsUrl && (
                    <p className="relative mt-4 text-xs text-emerald-400">
                      {uploadName ?? "archive.zip"} · ready
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-10 border-t border-white/[0.06] pt-8">
              <p className="text-sm font-medium text-white">Scan options</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    ["fastMode", "Fast scan"],
                    ["aiDetection", "AI detection"],
                    ["vivaQuestions", "Viva"],
                    ["interviewQuestions", "Interview"],
                    ["securityAudit", "Security"],
                    ["codeQuality", "Quality"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-200 transition",
                      options[key] && "border-indigo-500/40 bg-indigo-500/10",
                    )}
                  >
                    <Switch
                      checked={options[key]}
                      onCheckedChange={(v) => setOptions((o) => ({ ...o, [key]: v }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {options.fastMode && (
                <p className="mt-3 text-xs text-emerald-300/90">
                  Fast scan enabled: optimized for lower latency and higher success on deployed quota limits.
                </p>
              )}
            </div>

            <div className="mt-10">
              {tab === "github" ? (
                <Button
                  variant="gradient"
                  size="xl"
                  disabled={loading}
                  className="w-full shadow-xl shadow-indigo-500/25 sm:w-auto"
                  onClick={runGithub}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Analyze codebase
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="xl"
                  disabled={loading}
                  className="w-full shadow-xl shadow-indigo-500/25 sm:w-auto"
                  onClick={() => {
                    if (ufsUrl) void runZipJson();
                    else toast.error("Upload a ZIP or drop one above.");
                  }}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Analyze archive
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-[#0A0D14]/95 px-4 py-6 backdrop-blur-xl sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[var(--cv-mesh)] opacity-50" />
            <div className="relative mx-auto w-full max-w-md px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center sm:px-6">
              <div className="relative mx-auto mb-10 h-24 w-24">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-400 border-r-violet-500/50" />
                <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-fuchsia-500/40 border-l-indigo-400/30 [animation-direction:reverse] [animation-duration:1.2s]" />
                <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-indigo-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">Deep scan in progress</h2>
              <p className="mt-2 text-sm text-zinc-400">{SCAN_STAGES[stageIdx]}</p>
              <div className="mt-8 space-y-3 text-left">
                {SCAN_STAGES.map((s, i) => (
                  <div
                    key={s}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
                      i < stageIdx
                        ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-200"
                        : i === stageIdx
                          ? "border-indigo-500/30 bg-indigo-500/10 text-white"
                          : "border-white/[0.06] text-zinc-500",
                    )}
                  >
                    {i < stageIdx ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : i === stageIdx ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-400" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-zinc-600" />
                    )}
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full cv-shimmer bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((stageIdx + 1) / SCAN_STAGES.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
