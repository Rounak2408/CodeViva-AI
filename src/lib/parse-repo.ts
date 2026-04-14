import AdmZip from "adm-zip";
import { Octokit } from "octokit";
import {
  extOf,
  isLikelyText,
  shouldIgnorePath,
  SOURCE_EXTENSIONS,
} from "@/lib/code-file";
import { parseGithubUrl } from "@/lib/parse-github-url";

export { parseGithubUrl } from "@/lib/parse-github-url";

export type RepoFile = {
  path: string;
  content: string;
  bytes: number;
};

const MAX_FILES = 220;
const MAX_FILE_BYTES = 450_000;
const MAX_TOTAL_CHARS = 450_000;
const BLOB_BATCH_SIZE = 12;

async function fetchGithubArchive(
  owner: string,
  repo: string,
): Promise<Buffer | null> {
  const branches = ["main", "master"] as const;
  for (const branch of branches) {
    const url = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    return Buffer.from(await res.arrayBuffer());
  }
  return null;
}

function normalizeArchivePaths(files: RepoFile[]): RepoFile[] {
  return files.map((f) => {
    const parts = f.path.split("/").filter(Boolean);
    const normalized = parts.length > 1 ? parts.slice(1).join("/") : f.path;
    return { ...f, path: normalized || f.path };
  });
}

export async function fetchGithubRepoFiles(
  githubUrl: string,
): Promise<RepoFile[]> {
  try {
    const parsed = parseGithubUrl(githubUrl);
    if (!parsed) throw new Error("Invalid GitHub repository URL.");

    // Tokenless fallback: download the repo archive directly from codeload.
    if (!process.env.GITHUB_TOKEN?.trim()) {
      const archive = await fetchGithubArchive(parsed.owner, parsed.repo);
      if (!archive) {
        throw new Error(
          "Could not download repository archive. Check URL/visibility or use ZIP upload.",
        );
      }
      return normalizeArchivePaths(extractZipFiles(archive));
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      request: { fetch },
    });

    const { data: repo } = await octokit.rest.repos.get({
      owner: parsed.owner,
      repo: parsed.repo,
    });

    const branch = repo.default_branch;
    const { data: ref } = await octokit.rest.git.getRef({
      owner: parsed.owner,
      repo: parsed.repo,
      ref: `heads/${branch}`,
    });

    const sha = ref.object.sha;
    const { data: tree } = await octokit.rest.git.getTree({
      owner: parsed.owner,
      repo: parsed.repo,
      tree_sha: sha,
      recursive: "true",
    });

    const blobs = (tree.tree ?? []).filter(
      (t) =>
        t.type === "blob" &&
        t.path &&
        !shouldIgnorePath(t.path) &&
        SOURCE_EXTENSIONS.has(extOf(t.path)),
    );

    const limited = blobs.slice(0, MAX_FILES);
    const out: RepoFile[] = [];
    let totalChars = 0;

    for (let i = 0; i < limited.length; i += BLOB_BATCH_SIZE) {
      const batch = limited.slice(i, i + BLOB_BATCH_SIZE);
      const fetched = await Promise.all(
        batch.map(async (item) => {
          if (!item.path || !item.sha) return null;
          const { data: blob } = await octokit.rest.git.getBlob({
            owner: parsed.owner,
            repo: parsed.repo,
            file_sha: item.sha,
          });
          if (blob.encoding !== "base64" || !blob.content) return null;
          const buf = Buffer.from(blob.content, "base64");
          if (buf.length > MAX_FILE_BYTES || !isLikelyText(buf)) return null;
          const text = buf.toString("utf8");
          return { path: item.path, content: text, bytes: buf.length };
        }),
      );

      for (const file of fetched) {
        if (!file) continue;
        if (totalChars + file.content.length > MAX_TOTAL_CHARS) {
          break;
        }
        totalChars += file.content.length;
        out.push(file);
      }

      if (totalChars >= MAX_TOTAL_CHARS) break;
    }

    if (out.length === 0) {
      throw new Error(
        "No analyzable source files found. Try a public repo with visible code, or upload a ZIP.",
      );
    }

    return out;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg.includes("quota exhausted") ||
      msg.includes("rate limit") ||
      msg.includes("API rate limit exceeded")
    ) {
      throw new Error(
        "GitHub API rate limit hit. Add GITHUB_TOKEN in .env, wait a bit, or use ZIP upload.",
      );
    }
    throw e;
  }
}

export function extractZipFiles(buffer: Buffer): RepoFile[] {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const out: RepoFile[] = [];
  let totalChars = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.replace(/\\/g, "/");
    if (shouldIgnorePath(name)) continue;
    if (!SOURCE_EXTENSIONS.has(extOf(name))) continue;
    const data = entry.getData();
    if (data.length > MAX_FILE_BYTES || !isLikelyText(data)) continue;
    const text = data.toString("utf8");
    if (totalChars + text.length > MAX_TOTAL_CHARS) break;
    totalChars += text.length;
    out.push({ path: name, content: text, bytes: data.length });
    if (out.length >= MAX_FILES) break;
  }

  if (out.length === 0) {
    throw new Error(
      "No analyzable source files in ZIP. Include folders with .ts, .py, .java, etc.",
    );
  }

  return out;
}
