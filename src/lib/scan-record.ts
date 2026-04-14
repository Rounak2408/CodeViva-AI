import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import type { ScanOptions } from "@/types/analysis";

/** Ensures FK: only attach scans to users that exist (avoids P2003 on stale JWT). */
export async function resolveUserIdForScan(
  sessionUserId: string | undefined | null,
  sessionEmail?: string | undefined | null,
): Promise<string | undefined> {
  const id = sessionUserId?.trim();
  if (id) {
    const byId = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (byId?.id) return byId.id;
  }

  const email = sessionEmail?.trim().toLowerCase();
  if (!email) return undefined;
  const byEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return byEmail?.id;
}

export function optionsJson(o: ScanOptions): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(o)) as Prisma.InputJsonValue;
}

export function jsonValue(v: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

export function prismaScanErrorMessage(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    const metaCause =
      typeof e.meta?.cause === "string" && e.meta.cause.trim().length > 0
        ? e.meta.cause.trim()
        : undefined;

    if (e.code === "P2021") {
      return "Database is not set up. Run: npx prisma db push";
    }
    if (e.code === "P2003") {
      return "Session is out of sync. Sign out and sign in again.";
    }
    if (e.code === "P1001") {
      return "Database connection failed. Check that your local Prisma Postgres server is running.";
    }
    if (e.code === "ECONNREFUSED") {
      return "Database connection refused. Start your local DB or set DIRECT_DATABASE_URL to a running PostgreSQL instance.";
    }
    if (metaCause) return metaCause;
    return `Prisma error (${e.code}).`;
  }
  return e instanceof Error ? e.message : "Database error";
}
