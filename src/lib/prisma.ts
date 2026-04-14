import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const LOCAL_FALLBACK =
  "postgresql://postgres:postgres@127.0.0.1:5432/codeviva";

/**
 * Prisma Postgres URLs (`prisma+postgres://...?api_key=...`) embed a JSON
 * payload (base64) that contains `databaseUrl` — the real `postgres://` DSN for node-pg.
 */
function extractDirectPgFromPrismaUrl(url: string): string | null {
  if (!url.startsWith("prisma+postgres://")) return null;
  try {
    const u = new URL(url);
    const apiKey = u.searchParams.get("api_key");
    if (!apiKey) return null;
    let decoded: string;
    try {
      decoded = Buffer.from(apiKey, "base64url").toString("utf8");
    } catch {
      decoded = Buffer.from(apiKey, "base64").toString("utf8");
    }
    const parsed = JSON.parse(decoded) as { databaseUrl?: string };
    const d = parsed.databaseUrl?.trim();
    return d && d.length > 0 ? d : null;
  } catch {
    return null;
  }
}

/**
 * `@prisma/adapter-pg` uses `node-pg`, which only accepts `postgresql://` / `postgres://`.
 */
function resolveConnectionString(): string {
  const direct = process.env.DIRECT_DATABASE_URL?.trim();
  if (direct) return direct;

  const raw =
    process.env.DATABASE_URL?.trim() ?? LOCAL_FALLBACK;

  if (raw.startsWith("prisma+postgres://") || raw.startsWith("prisma://")) {
    const extracted = extractDirectPgFromPrismaUrl(raw);
    if (extracted) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[prisma] Using databaseUrl extracted from prisma+postgres:// connection string.",
        );
      }
      return extracted;
    }
    console.warn(
      "[prisma] DATABASE_URL is prisma+postgres:// but embedded URL could not be parsed. " +
        "Set DIRECT_DATABASE_URL to a postgresql:// URL from your Prisma dashboard.",
    );
    return LOCAL_FALLBACK;
  }

  return raw;
}

type PrismaGlobal = {
  prisma?: PrismaClient;
  prismaConfigKey?: string;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function createClient() {
  const directUrl = process.env.DIRECT_DATABASE_URL?.trim();
  if (directUrl) {
    const pool = new pg.Pool({ connectionString: directUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }

  const rawUrl = process.env.DATABASE_URL?.trim() ?? "";
  const useNativeEngineForPrismaUrl =
    rawUrl.startsWith("prisma+postgres://") || rawUrl.startsWith("prisma://");

  // Prisma's native engine can use prisma+postgres:// directly; node-pg cannot.
  if (useNativeEngineForPrismaUrl) {
    return new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }

  const pool = new pg.Pool({ connectionString: resolveConnectionString() });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function getConfigKey() {
  const directUrl = process.env.DIRECT_DATABASE_URL?.trim() ?? "";
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  return `${directUrl}|${databaseUrl}`;
}

const currentKey = getConfigKey();
if (!globalForPrisma.prisma || globalForPrisma.prismaConfigKey !== currentKey) {
  globalForPrisma.prisma = createClient();
  globalForPrisma.prismaConfigKey = currentKey;
}

export const prisma = globalForPrisma.prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConfigKey = currentKey;
}

export default prisma;
