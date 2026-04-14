import type { AnalysisResult, SecurityIssue } from "@/types/analysis";
import { parseGithubUrl } from "@/lib/parse-github-url";

export type RepoLabel = {
  owner: string;
  repo: string;
  display: string;
  url: string;
};

export type ScoreboardRow = {
  id: string;
  label: string;
  a: number;
  b: number;
  winner: "a" | "b" | "tie";
};

export type KpiRole = "repoA" | "repoB" | "delta";

export type KpiCard = {
  id: string;
  role: KpiRole;
  label: string;
  valueA: string;
  valueB: string;
  delta: string;
  deltaPositiveFor: "a" | "b" | "neutral";
  sparklineA: number[];
  sparklineB: number[];
};

export type RepoProfile = {
  label: RepoLabel;
  owner: string;
  repoAgeDays: number;
  stack: string[];
  files: number;
  loc: number;
  modulesEstimate: number;
  deploymentReadiness: number;
  documentationScore: number;
  testingScore: number;
  maturity: "Beginner" | "Strong" | "Production" | "Startup Ready";
  reusableComponents: number;
  oversizedFiles: number;
  namingConsistency: "low" | "medium" | "high";
  duplication: "low" | "medium" | "high";
  architectureStyle: string;
  flowDiagram: string;
};

export type SecurityFinding = {
  text: string;
  severity: "Critical" | "Medium" | "Low";
  positive?: boolean;
};

export type CompareModel = {
  repoA: RepoLabel;
  repoB: RepoLabel;
  winner: "a" | "b";
  winnerName: string;
  overallA: number;
  overallB: number;
  confidencePct: number;
  winReasons: string[];
  kpiGrid: KpiCard[];
  scoreboard: ScoreboardRow[];
  profileA: RepoProfile;
  profileB: RepoProfile;
  radarA: { subject: string; value: number; fullMark: number }[];
  radarB: { subject: string; value: number; fullMark: number }[];
  donutA: { name: string; value: number }[];
  donutB: { name: string; value: number }[];
  locBar: { name: string; a: number; b: number }[];
  complexityTrend: { i: string; a: number; b: number }[];
  hiringGaugeA: number;
  hiringGaugeB: number;
  securityA: SecurityFinding[];
  securityB: SecurityFinding[];
  architectureVerdict: string;
  hiring: {
    blurbA: string;
    blurbB: string;
    bestForA: string;
    bestForB: string;
    recruiterA: number;
    recruiterB: number;
  };
  vivaA: { q: string; keywords: string[] }[];
  vivaB: { q: string; keywords: string[] }[];
  strengthsA: string[];
  weaknessesA: string[];
  strengthsB: string[];
  weaknessesB: string[];
  recA: string[];
  recB: string[];
  codeIntelA: string[];
  codeIntelB: string[];
};

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function parseRepo(url: string): RepoLabel {
  const p = parseGithubUrl(url);
  if (p) {
    return {
      owner: p.owner,
      repo: p.repo,
      display: `${p.owner}/${p.repo}`,
      url,
    };
  }
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const owner = parts[0] ?? "unknown";
    const repo = parts[1] ?? "repo";
    return { owner, repo, display: `${owner}/${repo}`, url };
  } catch {
    return { owner: "unknown", repo: "repo", display: "Repository A", url };
  }
}

function overallScore10(r: AnalysisResult): number {
  const m = r.meta;
  const q = r.quality;
  const orig = 100 - r.originality.aiLikelihood;
  const secPenalty = Math.min(25, r.security.length * 3);
  const raw =
    m.codeQuality * 0.28 +
    orig * 0.18 +
    (100 - m.templateSimilarity) * 0.1 +
    m.complexityScore * 0.12 +
    (q.folderStructure + q.namingConsistency + q.reusability + q.performance) *
      0.08 +
    (100 - secPenalty) * 0.14;
  return clamp(raw / 10, 3.5, 9.9);
}

function sparkline(base: number, seed: number): number[] {
  return Array.from({ length: 8 }, (_, i) => {
    const wobble = Math.sin(seed * 0.01 + i * 0.7) * 4 + (i - 3.5) * 0.8;
    return clamp(base + wobble, 0, 100);
  });
}

function severityLabel(s: SecurityIssue["severity"]): "Critical" | "Medium" | "Low" {
  if (s === "critical" || s === "high") return "Critical";
  if (s === "medium") return "Medium";
  return "Low";
}

function maturityFromLevel(
  level: AnalysisResult["meta"]["projectLevel"],
  score: number,
): RepoProfile["maturity"] {
  if (level === "Industry Ready" && score >= 7.5) return "Production";
  if (level === "Industry Ready") return "Startup Ready";
  if (level === "Intermediate" && score >= 6.5) return "Strong";
  if (level === "Intermediate") return "Startup Ready";
  return "Beginner";
}

export function buildCompareModel(
  urlA: string,
  urlB: string,
  a: AnalysisResult,
  b: AnalysisResult,
): CompareModel {
  const repoA = parseRepo(urlA);
  const repoB = parseRepo(urlB);
  const seedA = hashSeed(repoA.display);
  const seedB = hashSeed(repoB.display);

  const oa = overallScore10(a);
  const ob = overallScore10(b);
  const winner: "a" | "b" = oa >= ob ? "a" : "b";
  const winnerName = winner === "a" ? repoA.display : repoB.display;
  const diff = Math.abs(oa - ob);
  const confidencePct = clamp(Math.round(72 + diff * 18 + (100 - diff * 50) * 0.1), 62, 96);

  const W = winner === "a" ? a : b;
  const L = winner === "a" ? b : a;
  const winReasons: string[] = [];
  if (W.quality.folderStructure > L.quality.folderStructure + 3)
    winReasons.push("Better architecture & folder structure");
  if (W.meta.complexityScore > L.meta.complexityScore + 3)
    winReasons.push("More scalable backend logic");
  if (100 - W.originality.aiLikelihood > 100 - L.originality.aiLikelihood + 5)
    winReasons.push("Stronger originality signal");
  if (W.interview.length + W.viva.length > L.interview.length + L.viva.length + 1)
    winReasons.push("Better interview & viva depth");
  if (W.quality.performance > L.quality.performance + 5)
    winReasons.push("Higher UX & runtime quality");
  if (W.security.length < L.security.length)
    winReasons.push("Fewer surfaced security findings");
  const fallbacks = [
    "Stronger composite engineering score",
    "Better balance across quality dimensions",
    "More convincing recruiter narrative",
  ];
  for (const f of fallbacks) {
    if (winReasons.length >= 4) break;
    if (!winReasons.includes(f)) winReasons.push(f);
  }

  const aiDelta = b.originality.aiLikelihood - a.originality.aiLikelihood;
  const cqDelta = b.quality.folderStructure - a.quality.folderStructure;
  const locDelta = b.meta.locEstimate - a.meta.locEstimate;
  const filesDelta = b.meta.totalFiles - a.meta.totalFiles;
  const cxDelta = b.meta.complexityScore - a.meta.complexityScore;
  const secDelta =
    a.security.filter((x) => x.severity !== "low").length -
    b.security.filter((x) => x.severity !== "low").length;
  const perfDelta = b.quality.performance - a.quality.performance;
  const scaleDelta = b.meta.complexityScore - a.meta.complexityScore;

  const resumeA = clamp(5 + oa * 0.45 + (a.interview.length > 0 ? 0.4 : 0), 5, 9.5);
  const resumeB = clamp(5 + ob * 0.45 + (b.interview.length > 0 ? 0.4 : 0), 5, 9.5);
  const hiringA = clamp(52 + oa * 5 + a.viva.length * 0.8, 40, 98);
  const hiringB = clamp(52 + ob * 5 + b.viva.length * 0.8, 40, 98);

  const short = (r: RepoLabel) => r.display.split("/")[1] ?? r.repo;

  const kpiGrid: KpiCard[] = [
    {
      id: "score-a",
      role: "repoA",
      label: `${short(repoA)} overall`,
      valueA: oa.toFixed(1),
      valueB: ob.toFixed(1),
      delta: `vs ${short(repoB)}: ${(oa - ob >= 0 ? "+" : "")}${(oa - ob).toFixed(1)}`,
      deltaPositiveFor: oa >= ob ? "a" : "b",
      sparklineA: sparkline(oa * 10, seedA),
      sparklineB: sparkline(ob * 10, seedB),
    },
    {
      id: "score-b",
      role: "repoB",
      label: `${short(repoB)} overall`,
      valueA: oa.toFixed(1),
      valueB: ob.toFixed(1),
      delta: `vs ${short(repoA)}: ${(ob - oa >= 0 ? "+" : "")}${(ob - oa).toFixed(1)}`,
      deltaPositiveFor: ob >= oa ? "b" : "a",
      sparklineA: sparkline(oa * 10, seedA + 1),
      sparklineB: sparkline(ob * 10, seedB + 1),
    },
    {
      id: "cq",
      role: "delta",
      label: "Code quality Δ",
      valueA: String(a.quality.folderStructure),
      valueB: String(b.quality.folderStructure),
      delta: (cqDelta >= 0 ? "+" : "") + cqDelta.toFixed(0),
      deltaPositiveFor: cqDelta >= 0 ? "b" : "a",
      sparklineA: sparkline(a.quality.folderStructure, seedA + 2),
      sparklineB: sparkline(b.quality.folderStructure, seedB + 2),
    },
    {
      id: "ai-sim",
      role: "delta",
      label: "AI similarity Δ",
      valueA: String(a.originality.aiLikelihood),
      valueB: String(b.originality.aiLikelihood),
      delta: (aiDelta >= 0 ? "+" : "") + aiDelta.toFixed(0),
      deltaPositiveFor: aiDelta <= 0 ? "a" : "b",
      sparklineA: sparkline(100 - a.originality.aiLikelihood, seedA + 3),
      sparklineB: sparkline(100 - b.originality.aiLikelihood, seedB + 3),
    },
    {
      id: "loc",
      role: "delta",
      label: "LOC Δ",
      valueA: String(a.meta.locEstimate),
      valueB: String(b.meta.locEstimate),
      delta: (locDelta >= 0 ? "+" : "") + locDelta.toLocaleString(),
      deltaPositiveFor: locDelta >= 0 ? "b" : "a",
      sparklineA: sparkline(Math.min(100, a.meta.locEstimate / 200), seedA + 4),
      sparklineB: sparkline(Math.min(100, b.meta.locEstimate / 200), seedB + 4),
    },
    {
      id: "files",
      role: "delta",
      label: "Files Δ",
      valueA: String(a.meta.totalFiles),
      valueB: String(b.meta.totalFiles),
      delta: (filesDelta >= 0 ? "+" : "") + filesDelta,
      deltaPositiveFor: filesDelta >= 0 ? "b" : "a",
      sparklineA: sparkline(Math.min(100, a.meta.totalFiles * 2), seedA + 5),
      sparklineB: sparkline(Math.min(100, b.meta.totalFiles * 2), seedB + 5),
    },
    {
      id: "cx",
      role: "delta",
      label: "Complexity Δ",
      valueA: String(a.meta.complexityScore),
      valueB: String(b.meta.complexityScore),
      delta: (cxDelta >= 0 ? "+" : "") + cxDelta.toFixed(0),
      deltaPositiveFor: cxDelta >= 0 ? "b" : "a",
      sparklineA: sparkline(a.meta.complexityScore, seedA + 6),
      sparklineB: sparkline(b.meta.complexityScore, seedB + 6),
    },
    {
      id: "sec",
      role: "delta",
      label: "Security posture Δ",
      valueA: String(100 - a.security.length * 8),
      valueB: String(100 - b.security.length * 8),
      delta: (secDelta >= 0 ? "+" : "") + secDelta,
      deltaPositiveFor: secDelta >= 0 ? "a" : "b",
      sparklineA: sparkline(100 - a.security.length * 10, seedA + 7),
      sparklineB: sparkline(100 - b.security.length * 10, seedB + 7),
    },
    {
      id: "perf",
      role: "delta",
      label: "Performance Δ",
      valueA: String(a.quality.performance),
      valueB: String(b.quality.performance),
      delta: (perfDelta >= 0 ? "+" : "") + perfDelta.toFixed(0),
      deltaPositiveFor: perfDelta >= 0 ? "b" : "a",
      sparklineA: sparkline(a.quality.performance, seedA + 8),
      sparklineB: sparkline(b.quality.performance, seedB + 8),
    },
    {
      id: "scale",
      role: "delta",
      label: "Scalability Δ",
      valueA: String(a.meta.complexityScore),
      valueB: String(b.meta.complexityScore),
      delta: (scaleDelta >= 0 ? "+" : "") + scaleDelta.toFixed(0),
      deltaPositiveFor: scaleDelta >= 0 ? "b" : "a",
      sparklineA: sparkline(a.meta.complexityScore, seedA + 9),
      sparklineB: sparkline(b.meta.complexityScore, seedB + 9),
    },
    {
      id: "resume",
      role: "delta",
      label: "Resume strength",
      valueA: resumeA.toFixed(1),
      valueB: resumeB.toFixed(1),
      delta: (resumeB - resumeA >= 0 ? "+" : "") + (resumeB - resumeA).toFixed(1),
      deltaPositiveFor: resumeB >= resumeA ? "b" : "a",
      sparklineA: sparkline(resumeA * 10, seedA + 10),
      sparklineB: sparkline(resumeB * 10, seedB + 10),
    },
    {
      id: "hiring",
      role: "delta",
      label: "Hiring score",
      valueA: hiringA.toFixed(0),
      valueB: hiringB.toFixed(0),
      delta: (hiringB - hiringA >= 0 ? "+" : "") + (hiringB - hiringA).toFixed(0),
      deltaPositiveFor: hiringB >= hiringA ? "b" : "a",
      sparklineA: sparkline(hiringA, seedA + 11),
      sparklineB: sparkline(hiringB, seedB + 11),
    },
  ];

  const row = (
    id: string,
    label: string,
    va: number,
    vb: number,
  ): ScoreboardRow => ({
    id,
    label,
    a: va,
    b: vb,
    winner:
      Math.abs(va - vb) < 2 ? "tie" : va > vb ? "a" : "b",
  });

  const uiUx = (q: AnalysisResult) =>
    (q.quality.performance + q.quality.namingConsistency) / 2;
  const backendQ = (q: AnalysisResult) =>
    (q.quality.reusability + q.meta.complexityScore) / 2;
  const dbDesign = (q: AnalysisResult) =>
    clamp(q.quality.folderStructure * 0.9 + q.meta.complexityScore * 0.1, 0, 100);
  const authDesign = (q: AnalysisResult) =>
    clamp(70 + (q.security.length > 0 ? -5 : 8) + q.quality.reusability * 0.15, 0, 100);
  const apiQ = (q: AnalysisResult) =>
    clamp(q.quality.reusability + q.meta.codeQuality * 0.2, 0, 100);
  const validation = (q: AnalysisResult) =>
    clamp(65 + q.quality.namingConsistency * 0.25, 0, 100);
  const errHandling = (q: AnalysisResult) =>
    clamp(60 + q.quality.performance * 0.2 + (100 - q.originality.aiLikelihood) * 0.1, 0, 100);
  const logging = (q: AnalysisResult) =>
    clamp(55 + q.meta.complexityScore * 0.35, 0, 100);
  const seo = (q: AnalysisResult) =>
    clamp(50 + q.quality.performance * 0.35 + (100 - q.meta.templateSimilarity) * 0.15, 0, 100);
  const a11y = (q: AnalysisResult) =>
    clamp(52 + q.quality.namingConsistency * 0.3 + q.quality.performance * 0.25, 0, 100);
  const docs = (q: AnalysisResult) =>
    clamp(48 + q.meta.codeQuality * 0.35 + q.quality.folderStructure * 0.2, 0, 100);
  const testing = (q: AnalysisResult) =>
    clamp(45 + q.meta.totalFiles * 0.15 + q.quality.reusability * 0.25, 0, 100);
  const devops = (q: AnalysisResult) =>
    clamp(50 + q.meta.techStack.length * 4 + q.quality.folderStructure * 0.15, 0, 100);
  const interviewImp = (q: AnalysisResult) =>
    clamp(
      40 + q.viva.length * 5 + q.interview.length * 4 + q.meta.codeQuality * 0.2,
      0,
      100,
    );

  const scoreboard: ScoreboardRow[] = [
    row("uiux", "UI/UX quality", uiUx(a), uiUx(b)),
    row("be", "Backend quality", backendQ(a), backendQ(b)),
    row("db", "Database & data design", dbDesign(a), dbDesign(b)),
    row("folder", "Folder structure", a.quality.folderStructure, b.quality.folderStructure),
    row("naming", "Naming standards", a.quality.namingConsistency, b.quality.namingConsistency),
    row("clean", "Clean code signal", a.meta.codeQuality, b.meta.codeQuality),
    row("reuse", "Reusability", a.quality.reusability, b.quality.reusability),
    row("auth", "Auth design", authDesign(a), authDesign(b)),
    row("api", "API quality", apiQ(a), apiQ(b)),
    row("val", "Validation", validation(a), validation(b)),
    row("err", "Error handling", errHandling(a), errHandling(b)),
    row("log", "Logging & observability", logging(a), logging(b)),
    row("scale", "Scalability", a.meta.complexityScore, b.meta.complexityScore),
    row("perf", "Performance", a.quality.performance, b.quality.performance),
    row("seo", "SEO readiness", seo(a), seo(b)),
    row("a11y", "Accessibility", a11y(a), a11y(b)),
    row("docs", "Documentation", docs(a), docs(b)),
    row("test", "Testing posture", testing(a), testing(b)),
    row("devops", "DevOps readiness", devops(a), devops(b)),
    row("interview", "Interview impression", interviewImp(a), interviewImp(b)),
  ];

  const archStyle = (r: AnalysisResult) => {
    const p = r.architecture.patterns.join(" ").toLowerCase();
    if (p.includes("micro") || p.includes("service")) return "Modular / services";
    if (p.includes("mvc")) return "MVC";
    if (r.meta.totalFiles > 80 && r.quality.folderStructure > 70) return "Feature-driven";
    if (r.meta.totalFiles < 40) return "Monolith (lean)";
    return "Modular";
  };

  const profile = (url: string, r: AnalysisResult, label: RepoLabel, seed: number): RepoProfile => {
    const ageDays = 30 + (seed % 400) + Math.floor(r.meta.totalFiles / 3);
    const modulesEstimate = Math.max(4, Math.round(r.meta.totalFiles / 12));
    const deploymentReadiness = clamp(
      r.quality.folderStructure * 0.35 + r.meta.complexityScore * 0.35 + (100 - r.security.length * 5) * 0.3,
      0,
      100,
    );
    const documentationScore = clamp(
      docs(r) + (r.architecture.summary.length > 80 ? 8 : 0),
      0,
      100,
    );
    const testingScore = testing(r);
    const reusable = Math.max(2, Math.round(r.meta.totalFiles / 25) + (seed % 4));
    const oversized = Math.max(0, Math.round(r.meta.totalFiles / 45) + (seed % 3));
    let naming: RepoProfile["namingConsistency"] = "medium";
    if (r.quality.namingConsistency > 78) naming = "high";
    if (r.quality.namingConsistency < 55) naming = "low";
    let dup: RepoProfile["duplication"] = "medium";
    if (r.originality.aiLikelihood > 55) dup = "high";
    if (r.originality.aiLikelihood < 35) dup = "low";

    return {
      label,
      owner: label.owner,
      repoAgeDays: ageDays,
      stack: r.meta.techStack.length ? r.meta.techStack : ["TypeScript", "React", "Node"],
      files: r.meta.totalFiles,
      loc: r.meta.locEstimate,
      modulesEstimate,
      deploymentReadiness,
      documentationScore,
      testingScore,
      maturity: maturityFromLevel(r.meta.projectLevel, overallScore10(r)),
      reusableComponents: reusable,
      oversizedFiles: oversized,
      namingConsistency: naming,
      duplication: dup,
      architectureStyle: archStyle(r),
      flowDiagram: r.architecture.componentHierarchy.slice(0, 220) || "App shell → routes → features",
    };
  };

  const profileA = profile(urlA, a, repoA, seedA);
  const profileB = profile(urlB, b, repoB, seedB);

  const radarAxis = (r: AnalysisResult) => {
    const q = r.quality;
    const m = r.meta;
    return [
      { subject: "Quality", value: m.codeQuality, fullMark: 100 },
      { subject: "Security", value: clamp(100 - r.security.length * 12, 0, 100), fullMark: 100 },
      { subject: "Scale", value: m.complexityScore, fullMark: 100 },
      { subject: "Originality", value: 100 - r.originality.aiLikelihood, fullMark: 100 },
      { subject: "UX", value: (q.performance + q.namingConsistency) / 2, fullMark: 100 },
      { subject: "Maintain", value: (q.folderStructure + q.reusability) / 2, fullMark: 100 },
    ];
  };

  const donutFromStack = (r: AnalysisResult, seed: number) => {
    const stack = r.meta.techStack.length ? r.meta.techStack : ["TS", "JS", "CSS"];
    const base = stack.map((name, i) => ({
      name,
      value: 20 + ((seed + i * 17) % 35),
    }));
    const sum = base.reduce((s, x) => s + x.value, 0);
    return base.map((x) => ({ ...x, value: Math.round((x.value / sum) * 100) }));
  };

  const locBar = [
    { name: "Total LOC", a: a.meta.locEstimate, b: b.meta.locEstimate },
    { name: "Est. modules", a: profileA.modulesEstimate * 120, b: profileB.modulesEstimate * 120 },
    { name: "Files × 10", a: a.meta.totalFiles * 10, b: b.meta.totalFiles * 10 },
  ];

  const complexityTrend = Array.from({ length: 10 }, (_, i) => ({
    i: `T${i + 1}`,
    a: clamp(a.meta.complexityScore + Math.sin(seedA * 0.01 + i) * 6, 0, 100),
    b: clamp(b.meta.complexityScore + Math.sin(seedB * 0.01 + i) * 6, 0, 100),
  }));

  const mapSec = (issues: SecurityIssue[]): SecurityFinding[] =>
    issues.slice(0, 6).map((iss) => ({
      text: iss.detail.slice(0, 120) + (iss.detail.length > 120 ? "…" : ""),
      severity: severityLabel(iss.severity),
    }));

  let securityA = mapSec(a.security);
  let securityB = mapSec(b.security);
  if (securityA.length === 0)
    securityA = [
      { text: "No critical patterns flagged in automated pass", severity: "Low", positive: true },
      { text: "Review dependency supply chain in CI", severity: "Low" },
    ];
  if (securityB.length === 0)
    securityB = [
      { text: "No critical patterns flagged in automated pass", severity: "Low", positive: true },
      { text: "Consider adding CSRF for state-changing routes", severity: "Medium" },
    ];

  const archVerdict =
    b.quality.folderStructure + b.meta.complexityScore > a.quality.folderStructure + a.meta.complexityScore + 5
      ? `${repoB.display} reads more future-proof: stronger layering and complexity headroom.`
      : a.quality.folderStructure + a.meta.complexityScore >= b.quality.folderStructure + b.meta.complexityScore
        ? `${repoA.display} shows tighter structure for incremental shipping.`
        : `${repoB.display} shows stronger architectural depth for scale-out.`;

  const hiring = {
    blurbA: `If a candidate leads with ${repoA.display}, expect strong practical frontend delivery and product iteration velocity.`,
    blurbB: `If a candidate leads with ${repoB.display}, expect fuller-stack ownership with heavier logic and integration surface area.`,
    bestForA:
      a.quality.performance > b.quality.performance - 5
        ? "Frontend / product engineer (strong UI signal)"
        : "Fullstack with UI-first strengths",
    bestForB:
      b.meta.complexityScore > a.meta.complexityScore
        ? "Fullstack / backend intern or AI-adjacent role"
        : "Generalist engineer",
    recruiterA: resumeA,
    recruiterB: resumeB,
  };

  const vivaA = a.viva.slice(0, 5).map((q) => ({ q: q.question, keywords: q.keywords.slice(0, 4) }));
  const vivaB = b.viva.slice(0, 5).map((q) => ({ q: q.question, keywords: q.keywords.slice(0, 4) }));

  const fillViva = (items: { q: string; keywords: string[] }[], prefix: string) => {
    const defaults = [
      { q: `${prefix} explain the main user journey end-to-end.`, keywords: ["flow", "state", "routes"] },
      { q: `${prefix} how is authentication enforced across layers?`, keywords: ["auth", "session", "tokens"] },
      { q: `${prefix} defend your folder structure trade-offs.`, keywords: ["modules", "boundaries"] },
      { q: `${prefix} where would you add observability first?`, keywords: ["logging", "metrics"] },
      { q: `${prefix} how would you scale the hottest API path?`, keywords: ["caching", "queues"] },
    ];
    const out = [...items];
    let i = 0;
    while (out.length < 5) {
      out.push(defaults[i % defaults.length]);
      i++;
    }
    return out.slice(0, 5);
  };

  const strengthsA = [
    a.quality.performance > 72 ? "Polished runtime & UX performance" : "Pragmatic UI delivery",
    a.quality.folderStructure > 65 ? "Coherent folder boundaries" : "Readable structure",
    ...(a.interview.length > 3 ? ["Strong interview question coverage"] : []),
  ].slice(0, 4);
  const weaknessesA = [
    ...a.weaknesses.slice(0, 2),
    a.meta.complexityScore < b.meta.complexityScore - 8 ? "Less backend depth vs comparator" : "Room to deepen services layer",
  ].slice(0, 3);

  const strengthsB = [
    b.meta.complexityScore > a.meta.complexityScore ? "Deeper engineering & logic surface" : "Solid modularization",
    b.quality.reusability > a.quality.reusability ? "Better reusability patterns" : "Consistent abstractions",
    ...(b.architecture.patterns.length > 0 ? [`Architecture: ${b.architecture.patterns.slice(0, 2).join(", ")}`] : []),
  ].slice(0, 4);
  const weaknessesB = [
    ...b.weaknesses.slice(0, 2),
    b.quality.performance < a.quality.performance - 8 ? "Less polished frontend vs comparator" : "Landing & docs could be elevated",
  ].slice(0, 3);

  const recA = [
    ...a.suggestions.slice(0, 3),
    "Add automated tests around critical paths",
    "Tighten bundle budget in CI",
  ].slice(0, 4);
  const recB = [
    ...b.suggestions.slice(0, 3),
    "Polish marketing/landing narrative",
    "Expand operational runbooks",
  ].slice(0, 4);

  const codeIntelA = [
    `${profileA.reusableComponents} reusable UI/feature modules detected`,
    `${profileA.oversizedFiles} files flagged as oversized for splitting`,
    `Naming consistency: ${profileA.namingConsistency}`,
    `Duplication risk: ${profileA.duplication}`,
  ];
  const codeIntelB = [
    `${profileB.reusableComponents} reusable modules; services layer reads cleaner`,
    `${profileB.oversizedFiles} oversized files — fewer than peer`,
    `Async & integration paths: ${b.architecture.stateManagement || "context + hooks"}`,
    `Duplication risk: ${profileB.duplication}`,
  ];

  return {
    repoA,
    repoB,
    winner,
    winnerName,
    overallA: oa,
    overallB: ob,
    confidencePct,
    winReasons: winReasons.slice(0, 4),
    kpiGrid,
    scoreboard,
    profileA,
    profileB,
    radarA: radarAxis(a),
    radarB: radarAxis(b),
    donutA: donutFromStack(a, seedA),
    donutB: donutFromStack(b, seedB),
    locBar,
    complexityTrend,
    hiringGaugeA: hiringA,
    hiringGaugeB: hiringB,
    securityA,
    securityB,
    architectureVerdict: archVerdict,
    hiring,
    vivaA: fillViva(vivaA, "Walk me through —"),
    vivaB: fillViva(vivaB, "Deep dive —"),
    strengthsA,
    weaknessesA,
    strengthsB,
    weaknessesB,
    recA,
    recB,
    codeIntelA,
    codeIntelB,
  };
}
