import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AnalysisResult, Difficulty, QuestionItem } from "@/types/analysis";

export default async function ResultsPage({
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
        <p className="text-lg text-slate-300">Scan not ready or failed.</p>
        {scan.error && (
          <p className="mt-2 max-w-md text-sm text-rose-400">{scan.error}</p>
        )}
      </div>
    );
  }

  const data = scan.result as unknown as AnalysisResult;
  data.viva = ensureVivaMinimum(data.viva);

  return (
    <ResultsDashboard
      scan={{
        id: scan.id,
        shareToken: scan.shareToken,
        isPublic: scan.isPublic,
        sourceRef: scan.sourceRef,
        sourceType: scan.sourceType,
      }}
      data={data}
    />
  );
}

function ensureVivaMinimum(viva: QuestionItem[] | undefined): QuestionItem[] {
  const list = Array.isArray(viva) ? viva : [];
  const normalized = list.map((q) => ({
    ...q,
    difficulty:
      q.difficulty === "Easy" || q.difficulty === "Medium" || q.difficulty === "Hard"
        ? q.difficulty
        : "Medium",
    sourceFile: q.sourceFile?.trim() || "README.md",
    keywords: Array.isArray(q.keywords) ? q.keywords : [],
    expectedAnswer:
      typeof q.expectedAnswer === "string" && q.expectedAnswer.trim().length > 0
        ? q.expectedAnswer
        : "Explain your reasoning with file-level references.",
  }));

  const by = {
    Easy: normalized.filter((q) => q.difficulty === "Easy"),
    Medium: normalized.filter((q) => q.difficulty === "Medium"),
    Hard: normalized.filter((q) => q.difficulty === "Hard"),
  };

  const required: Record<Difficulty, number> = { Easy: 2, Medium: 2, Hard: 1 };
  for (const diff of ["Easy", "Medium", "Hard"] as const) {
    while (by[diff].length < required[diff]) {
      by[diff].push(makeFallbackQuestion(diff, by[diff].length));
    }
  }

  const selected = [
    ...by.Easy.slice(0, 2),
    ...by.Medium.slice(0, 2),
    ...by.Hard.slice(0, 1),
    ...by.Easy.slice(2),
    ...by.Medium.slice(2),
    ...by.Hard.slice(1),
  ];
  return selected.slice(0, 10);
}

function makeFallbackQuestion(difficulty: Difficulty, idx: number): QuestionItem {
  if (difficulty === "Easy") {
    return {
      question:
        idx % 2 === 0
          ? "Identify the project's entry point and explain the execution flow."
          : "How are responsibilities split across the main modules in this project?",
      keywords: ["entry point", "flow", "modules"],
      expectedAnswer: "Concisely explain the core files/modules and their roles.",
      difficulty,
      sourceFile: "README.md",
    };
  }
  if (difficulty === "Medium") {
    return {
      question:
        idx % 2 === 0
          ? "How is the error-handling and validation strategy implemented?"
          : "If you add a new feature, which layer would you modify and why?",
      keywords: ["validation", "error handling", "modularity"],
      expectedAnswer: "Explain module boundaries and trade-offs clearly.",
      difficulty,
      sourceFile: "README.md",
    };
  }
  return {
    question:
      "At production scale, what is the main architectural bottleneck and how would you mitigate it?",
    keywords: ["scalability", "bottleneck", "mitigation"],
    expectedAnswer: "Explain a priority-wise mitigation plan with technical trade-offs.",
    difficulty,
    sourceFile: "README.md",
  };
}
