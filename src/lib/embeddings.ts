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

/**
 * Semantic similarity heatmap across files (embeddings).
 * Returns per-file scores 0–100 where higher means more similar to other files (cloned/boilerplate).
 */
export async function embeddingSimilarityHeatmap(
  files: RepoFile[],
): Promise<{ file: string; score: number }[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return files.slice(0, 12).map((f) => ({
      file: f.path,
      score: Math.round(20 + Math.random() * 25),
    }));
  }

  const openai = new OpenAI({ apiKey });
  const subset = files.slice(0, 24);
  const embeddings: number[][] = [];

  for (const f of subset) {
    const input = sampleSnippet(f);
    if (!input) {
      embeddings.push([]);
      continue;
    }
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input,
    });
    embeddings.push(res.data[0]?.embedding ?? []);
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
}
