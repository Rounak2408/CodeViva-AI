import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types/analysis";
import { FileDown, ArrowLeft } from "lucide-react";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const session = await auth();
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan) notFound();

  const allowed =
    !scan.userId ||
    (session?.user?.id && scan.userId === session.user.id) ||
    scan.isPublic;
  if (!allowed) redirect("/");

  if (scan.status !== "COMPLETE" || !scan.result) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-zinc-400">Report not available.</p>
      </div>
    );
  }

  const data = scan.result as unknown as AnalysisResult;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 print:max-w-none sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/results/${scanId}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <a
          href={`/api/report/${scanId}/pdf`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: "gradient", size: "sm" }),
            "rounded-xl",
          )}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Download PDF
        </a>
      </div>

      <article className="mt-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] shadow-2xl print:border-0 print:bg-white print:shadow-none">
        <div className="border-b border-white/[0.06] bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 px-8 py-10 print:bg-white print:from-transparent">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300 print:text-violet-700">
            CodeViva AI
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white print:text-zinc-900">
            Analysis report
          </h1>
          <p className="mt-2 font-mono text-sm text-zinc-400 print:text-zinc-600">
            {scan.sourceRef ?? scanId}
          </p>
        </div>
        <div className="space-y-10 px-8 py-10 print:text-zinc-900">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 print:text-zinc-600">
              Scores
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300 print:text-zinc-800">
              <li>AI probability: {data.meta.aiProbability}%</li>
              <li>Template similarity: {data.meta.templateSimilarity}%</li>
              <li>Code quality: {data.meta.codeQuality}%</li>
              <li>Project level: {data.meta.projectLevel}</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 print:text-zinc-600">
              Summary
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300 print:text-zinc-800">
              {data.resume}
            </p>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 print:text-zinc-600">
              Weaknesses & suggestions
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300 print:text-zinc-800">
              {data.weaknesses.map((w) => (
                <li key={w}>{w}</li>
              ))}
              {data.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
}
