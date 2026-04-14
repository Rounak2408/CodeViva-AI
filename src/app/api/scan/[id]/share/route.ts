import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/** Toggle public share link for a scan */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scan = await prisma.scan.findUnique({ where: { id } });
  if (!scan || scan.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.scan.update({
    where: { id },
    data: { isPublic: !scan.isPublic },
  });

  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "");

  return NextResponse.json({
    isPublic: updated.isPublic,
    shareUrl: base ? `${base}/share/${updated.shareToken}` : `/share/${updated.shareToken}`,
    shareToken: updated.shareToken,
  });
}
