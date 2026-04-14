import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ReportPdf } from "@/components/pdf/report-pdf";
import type { AnalysisResult } from "@/types/analysis";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await ctx.params;
  const session = await auth();

  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan?.result) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const allowed =
    !scan.userId ||
    (session?.user?.id && scan.userId === session.user.id) ||
    scan.isPublic;
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = scan.result as unknown as AnalysisResult;
  const pdfBuffer = await renderToBuffer(
    <ReportPdf data={data} title={scan.title ?? "CodeViva AI Report"} />,
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="codeviva-report-${scanId}.pdf"`,
    },
  });
}
