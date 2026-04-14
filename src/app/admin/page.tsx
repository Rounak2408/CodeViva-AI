import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [totalScans, totalUsers] = await Promise.all([
    prisma.scan.count(),
    prisma.user.count(),
  ]);

  const stacks = await prisma.scan.findMany({
    where: { status: "COMPLETE" },
    select: { result: true },
    take: 200,
  });

  const counts = new Map<string, number>();
  for (const s of stacks) {
    const r = s.result as { meta?: { techStack?: string[] } } | null;
    for (const t of r?.meta?.techStack ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const repos = await prisma.scan.findMany({
    where: { sourceType: "github", status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { sourceRef: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-white">Admin</h1>
      <p className="mt-2 text-slate-400">Operational overview (ADMIN role).</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-6">
          <p className="text-xs uppercase text-slate-500">Total scans</p>
          <p className="mt-2 text-4xl font-semibold text-white">{totalScans}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-6">
          <p className="text-xs uppercase text-slate-500">Users</p>
          <p className="mt-2 text-4xl font-semibold text-white">{totalUsers}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium text-white">Most analyzed stacks</h2>
          <ul className="mt-4 space-y-2">
            {top.map(([name, n]) => (
              <li
                key={name}
                className="flex justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-slate-300">{name}</span>
                <span className="text-slate-500">{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-medium text-white">Recent repos</h2>
          <ul className="mt-4 space-y-2">
            {repos.map((r) => (
              <li
                key={r.sourceRef ?? ""}
                className="truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-400"
              >
                {r.sourceRef}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
