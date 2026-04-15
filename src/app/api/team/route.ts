import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { resolveUserIdForScan } from "@/lib/scan-record";
import { sendTeamInviteEmail } from "@/lib/invite-email";

const createTeamSchema = z.object({
  action: z.literal("createTeam"),
  name: z.string().trim().min(2).max(80),
});

const inviteSchema = z
  .object({
    action: z.literal("inviteMember"),
    teamId: z.string().trim().min(1),
    email: z.string().trim().email().optional(),
    githubUsername: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9-]{1,39}$/)
      .optional(),
    role: z.string().trim().min(1).max(40).optional(),
  })
  .refine((v) => Boolean(v.email || v.githubUsername), {
    message: "Provide email or GitHub username.",
    path: ["email"],
  });

const respondInviteSchema = z.object({
  action: z.literal("respondInvite"),
  inviteId: z.string().trim().min(1),
  decision: z.enum(["accept", "reject"]),
});

const acceptInviteTokenSchema = z.object({
  action: z.literal("acceptInviteToken"),
  inviteToken: z.string().trim().min(1),
});

const bodySchema = z.union([
  createTeamSchema,
  inviteSchema,
  respondInviteSchema,
  acceptInviteTokenSchema,
]);

async function currentUser() {
  const session = await auth();
  const id = await resolveUserIdForScan(session?.user?.id, session?.user?.email);
  return { id, email: session?.user?.email?.trim().toLowerCase() ?? null };
}

async function githubUserIdFromUsername(username: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "codeviva-team-invite",
    };
    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: number };
    if (typeof data.id !== "number") return null;
    return String(data.id);
  } catch {
    return null;
  }
}

function appBaseUrl(req: Request): string {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured;
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET() {
  const me = await currentUser();
  const userId = me.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const teams = await prisma.team.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      invites: {
        where: { status: "PENDING" },
        include: {
          invitedBy: { select: { id: true, name: true, email: true } },
          inviteeUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const incomingInvites = await prisma.teamInvite.findMany({
    where: {
      status: "PENDING",
      OR: [
        { inviteeUserId: userId },
        ...(me.email ? [{ inviteEmail: me.email }] : []),
      ],
    },
    include: {
      team: { select: { id: true, name: true, ownerId: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ teams, incomingInvites });
}

export async function POST(req: Request) {
  const me = await currentUser();
  const userId = me.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "createTeam") {
    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        ownerId: userId,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });
    return NextResponse.json({ team });
  }

  if (parsed.data.action === "respondInvite") {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: parsed.data.inviteId },
    });
    if (!invite || invite.status !== "PENDING") {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    const canRespond =
      invite.inviteeUserId === userId ||
      (me.email !== null && invite.inviteEmail?.toLowerCase() === me.email);
    if (!canRespond) {
      return NextResponse.json({ error: "Not allowed for this invite." }, { status: 403 });
    }
    if (parsed.data.decision === "reject") {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ ok: true, message: "Invite rejected." });
    }
    await prisma.$transaction([
      prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: invite.teamId, userId } },
        update: { role: invite.role || "MEMBER" },
        create: { teamId: invite.teamId, userId, role: invite.role || "MEMBER" },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", inviteeUserId: userId },
      }),
    ]);
    return NextResponse.json({ ok: true, message: "Invite accepted. You joined the team." });
  }

  if (parsed.data.action === "acceptInviteToken") {
    const invite = await prisma.teamInvite.findFirst({
      where: { inviteToken: parsed.data.inviteToken },
      include: { team: { select: { id: true, name: true } } },
    });
    if (!invite || invite.status !== "PENDING") {
      return NextResponse.json({ error: "Invite token is invalid or expired." }, { status: 404 });
    }
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ error: "Invite expired." }, { status: 410 });
    }
    const canJoinByEmail =
      invite.inviteEmail && me.email && invite.inviteEmail.toLowerCase() === me.email;
    const canJoinByDirectUser = invite.inviteeUserId === userId;
    const canJoinByOpenInvite =
      !invite.inviteEmail && !invite.inviteeUserId && Boolean(invite.githubUsername);
    if (!canJoinByEmail && !canJoinByDirectUser && !canJoinByOpenInvite) {
      return NextResponse.json(
        { error: "This invite is not for your account. Sign in with the invited email." },
        { status: 403 },
      );
    }
    await prisma.$transaction([
      prisma.teamMember.upsert({
        where: {
          teamId_userId: { teamId: invite.teamId, userId },
        },
        update: { role: invite.role || "MEMBER" },
        create: { teamId: invite.teamId, userId, role: invite.role || "MEMBER" },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", inviteeUserId: userId },
      }),
    ]);
    return NextResponse.json({
      ok: true,
      message: `Joined ${invite.team.name}.`,
      teamId: invite.teamId,
    });
  }

  const { teamId, email, githubUsername } = parsed.data;
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true, name: true },
  });
  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  let inviteeId: string | null = null;
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    inviteeId = user?.id ?? null;
  } else if (githubUsername) {
    const githubId = await githubUserIdFromUsername(githubUsername);
    if (githubId) {
      const account = await prisma.account.findFirst({
        where: {
          provider: "github",
          providerAccountId: githubId,
        },
        select: { userId: true },
      });
      inviteeId = account?.userId ?? null;
    }
  }

  const normalizedEmail = email?.toLowerCase();

  if (inviteeId) {
    const member = await prisma.teamMember.upsert({
      where: {
        teamId_userId: { teamId, userId: inviteeId },
      },
      update: { role: parsed.data.role ?? "MEMBER" },
      create: {
        teamId,
        userId: inviteeId,
        role: parsed.data.role ?? "MEMBER",
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    await prisma.teamInvite.updateMany({
      where: {
        teamId,
        status: "PENDING",
        OR: [
          { inviteeUserId: inviteeId },
          ...(normalizedEmail ? [{ inviteEmail: normalizedEmail }] : []),
          ...(githubUsername ? [{ githubUsername }] : []),
        ],
      },
      data: { status: "ACCEPTED", inviteeUserId: inviteeId },
    });
    return NextResponse.json({
      ok: true,
      member,
      message: `Added ${member.user.name ?? member.user.email ?? "member"} to ${team.name}.`,
    });
  }

  const invite = await prisma.teamInvite.create({
    data: {
      teamId,
      invitedById: userId,
      inviteEmail: normalizedEmail,
      githubUsername,
      role: parsed.data.role ?? "MEMBER",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  const inviteUrl = `${appBaseUrl(req)}/team/invite/${invite.inviteToken}`;
  const inviter = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  let emailStatus:
    | { sent: boolean; reason?: string }
    | undefined;
  if (normalizedEmail) {
    emailStatus = await sendTeamInviteEmail({
      toEmail: normalizedEmail,
      inviterName: inviter?.name ?? inviter?.email ?? "A teammate",
      teamName: team.name,
      inviteUrl,
      expiresAt: invite.expiresAt,
    });
  }

  return NextResponse.json({
    ok: true,
    invite,
    inviteUrl,
    emailStatus,
    pending: true,
    message: "Invite saved. They can accept after signing in.",
    inviteHint: githubUsername ? `https://github.com/${githubUsername}` : undefined,
  });
}
