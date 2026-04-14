import OpenAI from "openai";
import type { AnalysisResult, ScanOptions } from "@/types/analysis";
import type { HeuristicStats } from "@/lib/heuristics";
import type { RepoFile } from "@/lib/parse-repo";

const SYSTEM = `You are CodeViva AI, a senior staff engineer and educator evaluating student/candidate projects.
Return ONLY valid JSON matching the schema. Scores are 0-100 integers. Be specific and reference files when possible.
Project level: Beginner | Intermediate | Industry Ready based on structure, tests, docs, error handling, and production practices.`;

function buildUserPrompt(
  files: RepoFile[],
  stats: HeuristicStats,
  options: ScanOptions,
): string {
  const summary = files
    .slice(0, 40)
    .map((f) => `--- ${f.path} (${f.bytes}b) ---\n${f.content.slice(0, 1800)}`)
    .join("\n\n");

  const langs = Object.entries(stats.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");

  const flags = [
    options.aiDetection ? "ai" : null,
    options.vivaQuestions ? "viva" : null,
    options.interviewQuestions ? "interview" : null,
    options.securityAudit ? "security" : null,
    options.codeQuality ? "quality" : null,
  ]
    .filter(Boolean)
    .join(",");

  return `Analyze this codebase. Options: ${flags}.
Heuristics: LOC=${stats.loc}, langs={${langs}}, avgLineLen=${stats.avgLineLen.toFixed(1)}, commentRatio=${(stats.commentRatio * 100).toFixed(1)}%, genericNameRatio=${(stats.genericNameRatio * 100).toFixed(1)}%, duplicateLineRatio=${(stats.duplicateLineRatio * 100).toFixed(1)}%, boilerplateHint=${stats.boilerplateScore.toFixed(0)}, complexityHint=${stats.complexityHint}.

Repository files (truncated):
${summary}

JSON schema:
{
  "meta": {
    "aiProbability": number,
    "templateSimilarity": number,
    "codeQuality": number,
    "projectLevel": "Beginner" | "Intermediate" | "Industry Ready",
    "techStack": string[],
    "totalFiles": number,
    "locEstimate": number,
    "complexityScore": number
  },
  "originality": {
    "aiLikelihood": number,
    "suspiciousFiles": [{"path": string, "reason": string, "score": number}],
    "similarityHeatmap": [{"file": string, "score": number}]
  },
  "quality": {
    "folderStructure": number,
    "namingConsistency": number,
    "reusability": number,
    "performance": number
  },
  "viva": [{"question": string, "keywords": string[], "expectedAnswer": string, "difficulty": "Easy"|"Medium"|"Hard", "sourceFile": string}],
  "interview": [{"question": string, "keywords": string[], "expectedAnswer": string, "difficulty": "Easy"|"Medium"|"Hard", "sourceFile": string}],
  "security": [{"category": string, "severity": "low"|"medium"|"high"|"critical", "detail": string, "file": string}],
  "architecture": {
    "patterns": string[],
    "componentHierarchy": string,
    "stateManagement": string,
    "summary": string
  },
  "resume": string,
  "weaknesses": string[],
  "suggestions": string[]
}

Rules:
- totalFiles and locEstimate should match the sample (approximate).
- If viva/interview disabled, return empty arrays for those keys.
- Every question MUST include keywords, expectedAnswer (short), difficulty, sourceFile from real paths in the sample.
- similarityHeatmap: 8-12 entries with file paths.
- suspiciousFiles: 3-8 files with reasons.
`;
}

function fallbackResult(
  files: RepoFile[],
  stats: HeuristicStats,
  options: ScanOptions,
): AnalysisResult {
  const techStack = Object.keys(stats.languages);
  const level =
    stats.loc > 8000 && stats.complexityHint > 45
      ? "Industry Ready"
      : stats.loc > 2000
        ? "Intermediate"
        : "Beginner";

  const heatmap = files.slice(0, 10).map((f) => ({
    file: f.path,
    score: Math.min(
      100,
      Math.round(stats.duplicateLineRatio * 60 + stats.boilerplateScore * 0.35),
    ),
  }));

  return {
    meta: {
      aiProbability: Math.round(
        Math.min(95, stats.boilerplateScore * 0.85 + stats.commentRatio * 30),
      ),
      templateSimilarity: Math.round(
        Math.min(95, stats.duplicateLineRatio * 100 + stats.genericNameRatio * 40),
      ),
      codeQuality: Math.round(
        Math.min(
          95,
          72 -
            stats.boilerplateScore * 0.35 +
            Math.min(20, stats.complexityHint * 0.15),
        ),
      ),
      projectLevel: level,
      techStack: techStack.length ? techStack : ["Unknown"],
      totalFiles: files.length,
      locEstimate: stats.loc,
      complexityScore: Math.min(100, stats.complexityHint),
    },
    originality: {
      aiLikelihood: Math.round(stats.boilerplateScore * 0.9),
      suspiciousFiles: files.slice(0, 5).map((f) => ({
        path: f.path,
        reason: "High structural repetition or generic naming",
        score: Math.round(40 + stats.duplicateLineRatio * 100),
      })),
      similarityHeatmap: heatmap,
    },
    quality: {
      folderStructure: Math.round(70 - stats.genericNameRatio * 40),
      namingConsistency: Math.round(65 - stats.genericNameRatio * 35),
      reusability: Math.round(60 + stats.complexityHint * 0.2),
      performance: Math.round(68),
    },
    viva: options.vivaQuestions
      ? [
          {
            question: "Walk through the main entry point and how requests flow through the project.",
            keywords: ["entry", "routing", "bootstrap", "main"],
            expectedAnswer: "Identify main file/module and describe request or data flow.",
            difficulty: "Medium",
            sourceFile: files[0]?.path ?? "README.md",
          },
          {
            question: "What design decisions would you change if this were deployed to production?",
            keywords: ["tests", "logging", "config", "errors"],
            expectedAnswer: "Mention observability, env config, validation, and tests.",
            difficulty: "Hard",
            sourceFile: files[1]?.path ?? files[0]?.path ?? "README.md",
          },
        ]
      : [],
    interview: options.interviewQuestions
      ? [
          {
            question: "How would you scale this system for 100k concurrent users?",
            keywords: ["cache", "CDN", "queue", "load balancer", "DB index"],
            expectedAnswer: "Caching layers, horizontal scaling, async jobs, DB tuning.",
            difficulty: "Hard",
            sourceFile: files[0]?.path ?? "README.md",
          },
        ]
      : [],
    security: options.securityAudit
      ? [
          {
            category: "Missing validation",
            severity: "medium",
            detail: "Verify all external inputs are validated at API boundaries.",
            file: files[0]?.path,
          },
        ]
      : [],
    architecture: {
      patterns: ["Layered modules", "Feature folders"],
      componentHierarchy: "Review folder structure for separation of concerns.",
      stateManagement: "Infer from imports (React state, context, or external store).",
      summary:
        "Architecture appears consistent with a typical application layout; confirm boundaries and dependencies.",
    },
    resume: `A ${level.toLowerCase()} project spanning ${files.length} files and ~${stats.loc} lines, with ${techStack.slice(0, 3).join(", ")}. Focus on explaining tradeoffs, testing, and deployment readiness.`,
    weaknesses: [
      "Add automated tests and CI if missing.",
      "Tighten environment configuration and secrets handling.",
    ],
    suggestions: [
      "Add README sections: setup, architecture, and known limitations.",
      "Introduce linting and formatting across the repo.",
    ],
  };
}

export async function analyzeWithOpenAI(
  files: RepoFile[],
  stats: HeuristicStats,
  options: ScanOptions,
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackResult(files, stats, options);
  }

  const openai = new OpenAI({ apiKey });
  const user = buildUserPrompt(files, stats, options);

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallbackResult(files, stats, options);
    const parsed = JSON.parse(raw) as AnalysisResult;
    if (!parsed.meta) return fallbackResult(files, stats, options);
    parsed.meta.totalFiles = files.length;
    parsed.meta.locEstimate = stats.loc;
    return parsed;
  } catch {
    return fallbackResult(files, stats, options);
  }
}
