import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const rows = await prisma.scan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      sourceRef: true,
      sourceType: true,
    },
  });

  return NextResponse.json(rows);
}
