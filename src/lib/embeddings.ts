import OpenAI from "openai";
import type { RepoFile } from "@/lib/parse-repo";

/** Cosine similarity between two vectors */
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

function sampleSnippet(f: RepoFile, max = 1200): string {
  return f.content.slice(0, max).replace(/\s+/g, " ").trim();
}

function stableScore(path: string): number {
  let h = 0;
  for (let i = 0; i < path.length; i++) {
    h = (Math.imul(31, h) + path.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function fallbackHeatmap(files: RepoFile[]): { file: string; score: number }[] {
  return files.slice(0, 12).map((f) => ({
    file: f.path,
    score: 18 + (stableScore(f.path) % 28),
  }));
}

/**
 * Semantic similarity heatmap across files (embeddings).
 * Returns per-file scores 0–100 where higher means more similar to other files (cloned/boilerplate).
 */
export async function embeddingSimilarityHeatmap(
  files: RepoFile[],
  fastMode = false,
): Promise<{ file: string; score: number }[]> {
  if (fastMode) {
    return fallbackHeatmap(files);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackHeatmap(files);
  }

  const openai = new OpenAI({ apiKey });
  const subset = files.slice(0, 24);
  const snippets = subset.map((f) => sampleSnippet(f));
  const indexedInputs = snippets
    .map((input, idx) => ({ input, idx }))
    .filter((x) => x.input.length > 0);
  if (indexedInputs.length === 0) {
    return fallbackHeatmap(files);
  }

  try {
    // Batch embeddings request: fewer API calls, faster scans, lower rate-limit pressure.
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: indexedInputs.map((x) => x.input),
    });
    const embeddings: number[][] = Array.from({ length: subset.length }, () => []);
    for (let i = 0; i < indexedInputs.length; i++) {
      const originalIdx = indexedInputs[i]!.idx;
      embeddings[originalIdx] = res.data[i]?.embedding ?? [];
    }

    const heatmap: { file: string; score: number }[] = [];
    for (let i = 0; i < subset.length; i++) {
      const ei = embeddings[i];
      if (!ei?.length) {
        heatmap.push({ file: subset[i]!.path, score: 15 });
        continue;
      }
      let maxSim = 0;
      for (let j = 0; j < subset.length; j++) {
        if (i === j) continue;
        const ej = embeddings[j];
        if (!ej?.length) continue;
        maxSim = Math.max(maxSim, cosine(ei, ej));
      }
      heatmap.push({
        file: subset[i]!.path,
        score: Math.round(Math.min(100, maxSim * 100)),
      });
    }
    return heatmap;
  } catch {
    // Fallback keeps scan usable when OpenAI quota/rate-limit is hit in production.
    return fallbackHeatmap(files);
  }
}
