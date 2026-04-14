import type {
  AnalysisResult,
  Difficulty,
  QuestionItem,
  ScanOptions,
} from "@/types/analysis";
import type { RepoFile } from "@/lib/parse-repo";
import {
  findSecuritySignals,
  runHeuristics,
} from "@/lib/heuristics";
import { embeddingSimilarityHeatmap } from "@/lib/embeddings";
import { analyzeWithOpenAI } from "@/lib/openai-analyze";

export async function runAnalysisPipeline(
  files: RepoFile[],
  options: ScanOptions,
): Promise<AnalysisResult> {
  const stats = runHeuristics(files);
  const [heuristicSecurity, heatmap] = await Promise.all([
    Promise.resolve(findSecuritySignals(files)),
    embeddingSimilarityHeatmap(files),
  ]);

  const base = await analyzeWithOpenAI(files, stats, options);

  if (options.securityAudit) {
    const merged = [...base.security];
    for (const h of heuristicSecurity) {
      merged.push({
        category: h.category,
        severity: h.severity === "high" ? "high" : "medium",
        detail: h.detail,
        file: h.file,
      });
    }
    const seen = new Set<string>();
    base.security = merged.filter((s) => {
      const k = `${s.file}-${s.detail}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  if (base.originality?.similarityHeatmap?.length < 4) {
    base.originality.similarityHeatmap = heatmap;
  } else {
    base.originality.similarityHeatmap = mergeHeatmaps(
      base.originality.similarityHeatmap,
      heatmap,
    );
  }

  if (!options.vivaQuestions) base.viva = [];
  else base.viva = normalizeVivaQuestions(base.viva, files);
  if (!options.interviewQuestions) base.interview = [];
  if (!options.securityAudit) base.security = [];
  if (!options.codeQuality) {
    base.quality = {
      folderStructure: 0,
      namingConsistency: 0,
      reusability: 0,
      performance: 0,
    };
  }
  if (!options.aiDetection) {
    base.meta.aiProbability = 0;
    base.originality.aiLikelihood = 0;
    base.meta.templateSimilarity = Math.round(base.meta.templateSimilarity * 0.3);
  }

  return base;
}

function normalizeVivaQuestions(
  questions: QuestionItem[],
  files: RepoFile[],
): QuestionItem[] {
  const sanitized = questions
    .filter((q) => typeof q.question === "string" && q.question.trim().length > 0)
    .map((q) => ({
      ...q,
      question: q.question.trim(),
      keywords: Array.isArray(q.keywords) ? q.keywords.slice(0, 8) : [],
      expectedAnswer:
        typeof q.expectedAnswer === "string" && q.expectedAnswer.trim().length > 0
          ? q.expectedAnswer.trim()
          : "Explain design choices with concrete code references.",
      sourceFile:
        typeof q.sourceFile === "string" && q.sourceFile.trim().length > 0
          ? q.sourceFile.trim()
          : files[0]?.path ?? "README.md",
      difficulty: normalizeDifficulty(q.difficulty),
    }));

  const byDifficulty = {
    Easy: sanitized.filter((q) => q.difficulty === "Easy"),
    Medium: sanitized.filter((q) => q.difficulty === "Medium"),
    Hard: sanitized.filter((q) => q.difficulty === "Hard"),
  };

  const minRequired: Record<Difficulty, number> = {
    Easy: 2,
    Medium: 2,
    Hard: 1,
  };

  for (const diff of ["Easy", "Medium", "Hard"] as const) {
    while (byDifficulty[diff].length < minRequired[diff]) {
      byDifficulty[diff].push(createVivaTemplate(diff, files, byDifficulty[diff].length));
    }
  }

  const selected: QuestionItem[] = [];
  for (const diff of ["Easy", "Medium", "Hard"] as const) {
    selected.push(...byDifficulty[diff].slice(0, minRequired[diff]));
  }

  const extras = [
    ...byDifficulty.Easy.slice(minRequired.Easy),
    ...byDifficulty.Medium.slice(minRequired.Medium),
    ...byDifficulty.Hard.slice(minRequired.Hard),
  ];

  // Keep upper bound predictable for UI while preserving required distribution.
  return [...selected, ...extras].slice(0, 10);
}

function normalizeDifficulty(value: unknown): Difficulty {
  return value === "Easy" || value === "Medium" || value === "Hard"
    ? value
    : "Medium";
}

function createVivaTemplate(
  difficulty: Difficulty,
  files: RepoFile[],
  idx: number,
): QuestionItem {
  const sourceFile = files[idx % Math.max(files.length, 1)]?.path ?? "README.md";
  if (difficulty === "Easy") {
    const prompts = [
      "Which entry point starts the data flow in this project, and what is the first major step?",
      "What is the primary purpose of this file, and where does it fit in the overall application?",
      "Give a quick build/run walkthrough and identify the most important scripts.",
    ];
    return {
      question: prompts[idx % prompts.length]!,
      keywords: ["entry point", "flow", "purpose", "setup"],
      expectedAnswer:
        "Clearly explain module responsibility and the basic execution flow.",
      difficulty,
      sourceFile,
    };
  }
  if (difficulty === "Medium") {
    const prompts = [
      "Explain the error-handling strategy: how are failures captured and surfaced?",
      "If you had to extend a feature, which module boundary is safest to change and why?",
      "Break down data validation and trust boundaries with file references.",
    ];
    return {
      question: prompts[idx % prompts.length]!,
      keywords: ["error handling", "modularity", "validation", "boundaries"],
      expectedAnswer:
        "Trade-offs, module boundaries, and maintainability impact with examples.",
      difficulty,
      sourceFile,
    };
  }
  const prompts = [
    "At production scale, what is the biggest bottleneck in this architecture, and what is your step-by-step mitigation plan?",
    "Create a security-hardening roadmap: top risks, priority order, and measurable outcomes.",
  ];
  return {
    question: prompts[idx % prompts.length]!,
    keywords: ["scalability", "security", "trade-offs", "roadmap"],
    expectedAnswer:
      "Prioritized plan with constraints, risk impact, and concrete implementation steps.",
    difficulty,
    sourceFile,
  };
}

function mergeHeatmaps(
  a: { file: string; score: number }[],
  b: { file: string; score: number }[],
): { file: string; score: number }[] {
  const map = new Map<string, number>();
  for (const x of a) map.set(x.file, x.score);
  for (const x of b) {
    const prev = map.get(x.file);
    map.set(x.file, prev === undefined ? x.score : Math.round((prev + x.score) / 2));
  }
  return [...map.entries()].map(([file, score]) => ({ file, score }));
}
