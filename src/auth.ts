import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role: string };
  }
}

/** Required by Auth.js for cookies / JWT. Prefer AUTH_SECRET in .env (see .env.example). */
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  "codeviva-dev-only-secret-min-32-chars-do-not-use-in-prod";
const githubClientId =
  process.env.GITHUB_CLIENT_ID?.trim() ?? process.env.GITHUB_ID?.trim() ?? "";
const githubClientSecret =
  process.env.GITHUB_CLIENT_SECRET?.trim() ?? process.env.GITHUB_SECRET?.trim() ?? "";

function displayName(name?: string | null, email?: string | null): string {
  const n = name?.trim();
  if (n) return n;
  const local = email?.split("@")[0]?.trim();
  return local || "User";
}

const providers = [];

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

providers.push(
  Credentials({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
);

providers.push(
  Credentials({
    id: "demo",
    name: "Demo workspace",
    credentials: {},
    authorize: async () => {
      const email = "demo@codeviva.ai";
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: "Demo Analyst",
            emailVerified: new Date(),
          },
        });
      }
      return user;
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  providers,
  trustHost: true,
  // Credentials provider requires JWT sessions (database sessions are not supported).
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role?: string;
          name?: string | null;
          email?: string | null;
        };
        token.id = u.id;
        token.role = (u.role as string) ?? "USER";
        token.name = displayName(u.name, u.email);
        if (u.email) token.email = u.email;
      }
      // Keep a stable user id in JWT across refreshes/navigation.
      if (!token.id && typeof token.sub === "string") {
        token.id = token.sub;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const email = (session.user.email as string | null | undefined) ??
          (token.email as string | null | undefined) ??
          null;
        session.user.id =
          (token.id as string | undefined) ??
          (typeof token.sub === "string" ? token.sub : "") ??
          "";
        session.user.role = (token.role as string) ?? "USER";
        session.user.name = displayName(session.user.name, email);
      }
      return session;
    },
  },
});
