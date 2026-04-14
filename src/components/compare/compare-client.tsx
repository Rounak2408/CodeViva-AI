"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AnalysisResult } from "@/types/analysis";
import { parseJsonSafe } from "@/lib/api-response";
import { CompareDashboard } from "@/components/compare/compare-dashboard";

function CompareClientInner() {
  const searchParams = useSearchParams();
  const [a, setA] = useState("https://github.com/vercel/next.js");
  const [b, setB] = useState("https://github.com/remix-run/react-router");
  const [loading, setLoading] = useState(false);
  const [resultA, setResultA] = useState<AnalysisResult | null>(null);
  const [resultB, setResultB] = useState<AnalysisResult | null>(null);
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [scanAId, setScanAId] = useState<string | null>(null);
  const [scanBId, setScanBId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ua = searchParams.get("urlA");
    const ub = searchParams.get("urlB");
    if (ua?.trim()) setA(ua.trim());
    if (ub?.trim()) setB(ub.trim());
  }, [searchParams]);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlA: a, urlB: b }),
      });
      const data = await parseJsonSafe<{
        error?: string;
        comparisonId?: string;
        scanAId?: string;
        scanBId?: string;
        resultA?: AnalysisResult;
        resultB?: AnalysisResult;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Compare failed");
      setResultA(data.resultA ?? null);
      setResultB(data.resultB ?? null);
      setComparisonId(data.comparisonId ?? null);
      setScanAId(data.scanAId ?? null);
      setScanBId(data.scanBId ?? null);
      toast.success("Comparison ready");
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Compare failed");
    } finally {
      setLoading(false);
    }
  }

  function resetCompare() {
    setResultA(null);
    setResultB(null);
    setComparisonId(null);
    setScanAId(null);
    setScanBId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mt-10 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="cv-surface grid gap-6 p-6 sm:grid-cols-2 sm:p-8"
      >
        <div>
          <Label className="text-zinc-300">Repository A</Label>
          <Input
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="mt-2 h-11 rounded-xl border-white/[0.08] bg-black/30 font-mono text-sm text-white"
          />
        </div>
        <div>
          <Label className="text-zinc-300">Repository B</Label>
          <Input
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="mt-2 h-11 rounded-xl border-white/[0.08] bg-black/30 font-mono text-sm text-white"
          />
        </div>
      </motion.div>
      <Button
        variant="gradient"
        size="xl"
        disabled={loading}
        className="w-full shadow-xl shadow-indigo-500/20 sm:w-auto"
        onClick={() => void run()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <GitCompare className="mr-2 h-5 w-5" />
        )}
        Run intelligence compare
      </Button>

      {resultA && resultB && (
        <div ref={resultsRef} className="scroll-mt-8">
          <CompareDashboard
            urlA={a}
            urlB={b}
            resultA={resultA}
            resultB={resultB}
            comparisonId={comparisonId}
            scanAId={scanAId}
            scanBId={scanBId}
            onCompareAnother={resetCompare}
          />
        </div>
      )}
    </div>
  );
}

export function CompareClient() {
  return (
    <Suspense
      fallback={
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading compare…
        </div>
      }
    >
      <CompareClientInner />
    </Suspense>
  );
}
