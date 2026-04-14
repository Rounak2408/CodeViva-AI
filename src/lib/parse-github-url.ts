/** Pure URL parsing — safe to import from client bundles (no Node/fs deps). */
export function parseGithubUrl(
  raw: string,
): { owner: string; repo: string } | null {
  try {
    const u = new URL(raw.trim());
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0]!, repo: parts[1]!.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}
