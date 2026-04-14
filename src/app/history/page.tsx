import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function HistoryPage() {
  const session = await auth();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  const resolvedUserId =
    session?.user?.id?.trim() ||
    (sessionEmail
      ? (
          await prisma.user.findUnique({
            where: { email: sessionEmail },
            select: { id: true },
          })
        )?.id
      : undefined);
  if (!resolvedUserId) redirect("/");

  const scans = await prisma.scan.findMany({
    where: { userId: resolvedUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-white">Scan history</h1>
      <p className="mt-2 text-slate-400">
        Re-open any completed analysis from your workspace.
      </p>
      <ul className="mt-8 space-y-3">
        {scans.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111827]/80 px-4 py-3 backdrop-blur"
          >
            <div>
              <p className="font-medium text-white">
                {s.title ?? s.sourceRef ?? s.id}
              </p>
              <p className="text-xs text-slate-500">
                {s.createdAt.toISOString().slice(0, 10)} · {s.sourceType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/10">
                {s.status}
              </Badge>
              {s.status === "COMPLETE" && (
                <Link
                  href={`/results/${s.id}`}
                  className="text-sm text-indigo-400 hover:underline"
                >
                  Open
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      {scans.length === 0 && (
        <p className="mt-8 text-center text-slate-500">
          No scans yet.{" "}
          <Link href="/analyzer" className="text-indigo-400">
            Run an analyzer
          </Link>
        </p>
      )}
    </div>
  );
}
