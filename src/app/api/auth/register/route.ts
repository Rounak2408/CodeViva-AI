import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number")
    .regex(/[^A-Za-z0-9]/, "Include a symbol"),
});

function prismaMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/passwordHash|Unknown column|does not exist|UndefinedColumn|P2022/i.test(msg)) {
    return "Database schema is outdated. From the project folder run: npx prisma db push";
  }
  if (/P1001|P1017|ECONNREFUSED|timeout|connect/i.test(msg)) {
    return "Cannot connect to the database. Check Postgres is running and DATABASE_URL in .env";
  }
  if (process.env.NODE_ENV === "development") {
    return msg.slice(0, 280);
  }
  return "Registration failed. Please try again.";
}

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid body";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { name, email, password } = parsed.data;
    const emailLower = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            "This email is already registered. Sign in instead, or use Google/GitHub if you used those before.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name,
        email: emailLower,
        emailVerified: new Date(),
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/register]", e);
    const code =
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code: unknown }).code === "string"
        ? (e as { code: string }).code
        : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "This email is already in use." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: prismaMessage(e) },
      { status: 500 },
    );
  }
}
