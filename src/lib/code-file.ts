/** Extensions we treat as source for analysis */
export const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".cs",
  ".rb",
  ".php",
  ".swift",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".sql",
  ".graphql",
  ".md",
  ".json",
  ".yaml",
  ".yml",
]);

export const IGNORE_PATHS = [
  /node_modules/i,
  /\.git/i,
  /dist\//i,
  /build\//i,
  /\.next\//i,
  /coverage\//i,
  /\.cache/i,
  /vendor\//i,
  /\.venv/i,
  /__pycache__/i,
  /\.lock$/i,
  /package-lock\.json$/i,
  /\.min\.(js|css)$/i,
];

export function shouldIgnorePath(path: string): boolean {
  return IGNORE_PATHS.some((r) => r.test(path));
}

export function extOf(path: string): string {
  const i = path.lastIndexOf(".");
  return i >= 0 ? path.slice(i).toLowerCase() : "";
}

export function isLikelyText(bytes: Buffer, maxCheck = 8000): boolean {
  const slice = bytes.subarray(0, Math.min(bytes.length, maxCheck));
  let bad = 0;
  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    if (c === undefined) continue;
    if (c === 9 || c === 10 || c === 13) continue;
    if (c < 32 || c === 255) bad++;
  }
  return bad / slice.length < 0.02;
}
