import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalScans, totalUsers, completeScans] = await Promise.all([
    prisma.scan.count(),
    prisma.user.count(),
    prisma.scan.findMany({
      where: { status: "COMPLETE" },
      select: { result: true },
    }),
  ]);

  const stackCounts = new Map<string, number>();
  for (const s of completeScans) {
    const r = s.result as { meta?: { techStack?: string[] } } | null;
    const stacks = r?.meta?.techStack ?? [];
    for (const t of stacks) {
      stackCounts.set(t, (stackCounts.get(t) ?? 0) + 1);
    }
  }

  const mostAnalyzedStacks = [...stackCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const popularRepos = await prisma.scan.findMany({
    where: { sourceType: "github", status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { sourceRef: true, createdAt: true },
  });

  return NextResponse.json({
    totalScans,
    totalUsers,
    mostAnalyzedStacks,
    popularRepos: popularRepos,
  });
}
