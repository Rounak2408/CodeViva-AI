import type { RepoFile } from "@/lib/parse-repo";

/** Rough cyclomatic-style weight from control keywords */
const CTRL = /\b(if|else|for|while|switch|case|catch|&&|\|\|)\b/g;

export type HeuristicStats = {
  loc: number;
  languages: Record<string, number>;
  avgLineLen: number;
  commentRatio: number;
  genericNameRatio: number;
  duplicateLineRatio: number;
  boilerplateScore: number;
  complexityHint: number;
};

function detectLang(path: string): string {
  const e = path.slice(path.lastIndexOf(".")).toLowerCase();
  const map: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TSX",
    ".js": "JavaScript",
    ".jsx": "JSX",
    ".py": "Python",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".vue": "Vue",
    ".svelte": "Svelte",
  };
  return map[e] ?? "Other";
}

const GENERIC = /^(utils|helper|helpers|common|index|temp|test|data)\./i;

export function runHeuristics(files: RepoFile[]): HeuristicStats {
  let loc = 0;
  const languages: Record<string, number> = {};
  let totalLineLen = 0;
  let lines = 0;
  let commentLines = 0;
  let genericFiles = 0;
  const lineHashes = new Map<string, number>();
  let ctrlHits = 0;

  for (const f of files) {
    const lang = detectLang(f.path);
    languages[lang] = (languages[lang] ?? 0) + 1;
    const base = f.path.split("/").pop() ?? f.path;
    if (GENERIC.test(base)) genericFiles++;

    const ls = f.content.split(/\r?\n/);
    for (const line of ls) {
      const t = line.trim();
      if (!t) continue;
      loc++;
      totalLineLen += t.length;
      lines++;
      if (
        t.startsWith("//") ||
        t.startsWith("/*") ||
        t.startsWith("*") ||
        t.startsWith("#")
      ) {
        commentLines++;
      }
      const norm = t.replace(/\s+/g, " ");
      lineHashes.set(norm, (lineHashes.get(norm) ?? 0) + 1);
      const m = t.match(CTRL);
      ctrlHits += m?.length ?? 0;
    }
  }

  let dupLines = 0;
  for (const [, c] of lineHashes) {
    if (c > 1) dupLines += c - 1;
  }
  const duplicateLineRatio =
    lines > 0 ? Math.min(1, dupLines / Math.max(lines, 1)) : 0;
  const commentRatio = lines > 0 ? commentLines / lines : 0;
  const avgLineLen = lines > 0 ? totalLineLen / lines : 0;
  const genericNameRatio = files.length
    ? genericFiles / files.length
    : 0;

  const boilerplateScore = Math.min(
    100,
    duplicateLineRatio * 40 +
      commentRatio * 25 +
      genericNameRatio * 20 +
      (avgLineLen > 90 ? 15 : 0),
  );

  const complexityHint = Math.min(
    100,
    Math.round(
      (ctrlHits / Math.max(loc, 1)) * 120 +
        Math.log10(Math.max(loc, 10)) * 12,
    ),
  );

  return {
    loc,
    languages,
    avgLineLen,
    commentRatio,
    genericNameRatio,
    duplicateLineRatio,
    boilerplateScore,
    complexityHint,
  };
}

const SECRET_PATTERNS: { re: RegExp; category: string }[] = [
  {
    re: /(api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    category: "Hardcoded secrets",
  },
  {
    re: /sk-[a-zA-Z0-9]{20,}/,
    category: "Hardcoded secrets",
  },
  {
    re: /AKIA[0-9A-Z]{16}/,
    category: "Hardcoded secrets",
  },
  {
    re: /BEGIN (RSA |OPENSSH )?PRIVATE KEY/,
    category: "Hardcoded secrets",
  },
];

export function findSecuritySignals(
  files: RepoFile[],
): { category: string; severity: "low" | "medium" | "high"; detail: string; file?: string }[] {
  const issues: {
    category: string;
    severity: "low" | "medium" | "high";
    detail: string;
    file?: string;
  }[] = [];

  for (const f of files) {
    for (const { re, category } of SECRET_PATTERNS) {
      if (re.test(f.content)) {
        issues.push({
          category,
          severity: "high",
          detail: "Possible secret or key material in source.",
          file: f.path,
        });
        break;
      }
    }
    if (
      /\.query\(\s*[`'"]?\s*SELECT/i.test(f.content) &&
      /\$\{|\+/.test(f.content)
    ) {
      issues.push({
        category: "Unsafe APIs",
        severity: "medium",
        detail: "Possible SQL concatenation — prefer parameterized queries.",
        file: f.path,
      });
    }
    if (/eval\s*\(/.test(f.content)) {
      issues.push({
        category: "Unsafe APIs",
        severity: "high",
        detail: "Use of eval() detected.",
        file: f.path,
      });
    }
  }

  const seen = new Set<string>();
  return issues.filter((i) => {
    const k = `${i.file}-${i.detail}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
