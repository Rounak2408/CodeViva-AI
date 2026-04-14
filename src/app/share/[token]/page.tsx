import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AnalysisResult } from "@/types/analysis";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const scan = await prisma.scan.findFirst({
    where: { shareToken: token, isPublic: true, status: "COMPLETE" },
  });
  if (!scan?.result) notFound();

  const data = scan.result as unknown as AnalysisResult;

  return (
    <ResultsDashboard
      scan={{
        id: scan.id,
        shareToken: scan.shareToken,
        isPublic: scan.isPublic,
        sourceRef: scan.sourceRef,
        sourceType: scan.sourceType,
      }}
      data={data}
    />
  );
}
