import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
        <Users className="h-7 w-7 text-white" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold text-white">Team collaboration</h1>
      <p className="mt-3 text-slate-400">
        Shared workspaces, role-based access, and org-wide scan libraries are
        designed into the data model (teams + members). Wire your Clerk or
        SAML provider and enable multi-seat billing on top of this foundation.
      </p>
      <p className="mt-6 text-sm text-slate-500">
        Prisma models: <code className="text-indigo-300">Team</code>,{" "}
        <code className="text-indigo-300">TeamMember</code> — ready for your SSO
        layer.
      </p>
    </div>
  );
}
