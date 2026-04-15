"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, UserPlus, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseJsonSafe } from "@/lib/api-response";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string | null };
};

type Team = {
  id: string;
  name: string;
  createdAt: string;
  members: Member[];
  invites?: PendingInvite[];
};

type PendingInvite = {
  id: string;
  teamId: string;
  inviteEmail: string | null;
  githubUsername: string | null;
  inviteToken: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  expiresAt?: string | null;
  invitedBy: { id: string; name: string | null; email: string | null };
};

type IncomingInvite = {
  id: string;
  role: string;
  inviteEmail: string | null;
  githubUsername: string | null;
  team: { id: string; name: string; ownerId: string };
  invitedBy: { id: string; name: string | null; email: string | null };
};

export function TeamCollaborationPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});

  async function loadTeams() {
    setLoading(true);
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      const data = await parseJsonSafe<{
        teams?: Team[];
        incomingInvites?: IncomingInvite[];
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not load teams");
      const list = data.teams ?? [];
      setTeams(list);
      setIncomingInvites(data.incomingInvites ?? []);
      if (!selectedTeamId && list.length > 0) {
        setSelectedTeamId(list[0]!.id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeams();
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const token = p.get("invite");
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "acceptInviteToken",
            inviteToken: token,
          }),
        });
        const data = await parseJsonSafe<{ ok?: boolean; message?: string; error?: string }>(res);
        if (!res.ok) throw new Error(data.error ?? "Could not accept invite link");
        toast.success(data.message ?? "Invite accepted");
        await loadTeams();
        const next = new URL(window.location.href);
        next.searchParams.delete("invite");
        window.history.replaceState({}, "", next.toString());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Invite link failed");
      }
    })();
  }, []);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId],
  );

  async function createTeam() {
    const name = teamName.trim();
    if (name.length < 2) {
      toast.error("Team name should be at least 2 characters.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createTeam", name }),
      });
      const data = await parseJsonSafe<{ error?: string; team?: Team }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not create team");
      setTeamName("");
      toast.success("Team created");
      await loadTeams();
      if (data.team?.id) setSelectedTeamId(data.team.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create team failed");
    } finally {
      setCreating(false);
    }
  }

  async function inviteMember() {
    if (!selectedTeamId) {
      toast.error("Select a team first.");
      return;
    }
    const email = inviteEmail.trim();
    const github = githubUsername.trim();
    if (!email && !github) {
      toast.error("Enter invitee email or GitHub username.");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "inviteMember",
          teamId: selectedTeamId,
          email: email || undefined,
          githubUsername: github || undefined,
        }),
      });
      const data = await parseJsonSafe<{
        ok?: boolean;
        message?: string;
        error?: string;
        inviteHint?: string;
        pending?: boolean;
        invite?: { id: string };
        inviteUrl?: string;
        emailStatus?: { sent: boolean; reason?: string };
      }>(res);
      if (!res.ok) {
        if (data.inviteHint) {
          toast.message("Invite hint", { description: `Profile: ${data.inviteHint}` });
        }
        throw new Error(data.error ?? "Invite failed");
      }
      setInviteEmail("");
      setGithubUsername("");
      toast.success(data.message ?? (data.pending ? "Invite saved" : "Member invited"));
      if (data.pending && data.emailStatus && !data.emailStatus.sent && data.emailStatus.reason) {
        toast.message("Email not sent", { description: data.emailStatus.reason });
      }
      if (data.pending && data.emailStatus?.sent) {
        toast.success("Invite email sent");
      }
      if (data.pending && data.invite?.id && data.inviteUrl) {
        setInviteLinks((prev) => ({ ...prev, [data.invite!.id]: data.inviteUrl! }));
      }
      await loadTeams();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  function inviteLinkFor(inv: PendingInvite): string {
    if (inviteLinks[inv.id]) return inviteLinks[inv.id]!;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/team/invite/${inv.inviteToken}`;
  }

  async function copyInviteLink(inv: PendingInvite) {
    const link = inviteLinkFor(inv);
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  }

  function sendInviteEmail(inv: PendingInvite) {
    const link = inviteLinkFor(inv);
    const to = inv.inviteEmail ?? "";
    const subject = encodeURIComponent("You are invited to join a CodeViva team");
    const body = encodeURIComponent(
      `Hi,\n\nYou've been invited to join a team on CodeViva.\n\nAccept invite: ${link}\n\nThis invite may expire in 7 days.\n`,
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  async function respondInvite(inviteId: string, decision: "accept" | "reject") {
    setRespondingInviteId(inviteId);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respondInvite",
          inviteId,
          decision,
        }),
      });
      const data = await parseJsonSafe<{ error?: string; message?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not update invite");
      toast.success(data.message ?? "Invite updated");
      await loadTeams();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invite update failed");
    } finally {
      setRespondingInviteId(null);
    }
  }

  return (
    <div className="mt-12 space-y-6 text-left">
      {incomingInvites.length > 0 && (
        <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-5">
          <h2 className="text-lg font-semibold text-white">Pending invites for you</h2>
          <div className="mt-3 space-y-3">
            {incomingInvites.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-sm text-white">
                  <span className="font-semibold">{inv.team.name}</span> invited by{" "}
                  {inv.invitedBy.name ?? inv.invitedBy.email ?? "teammate"}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Role: {inv.role}
                  {inv.inviteEmail ? ` · ${inv.inviteEmail}` : ""}
                  {inv.githubUsername ? ` · @${inv.githubUsername}` : ""}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="gradient"
                    disabled={respondingInviteId === inv.id}
                    onClick={() => void respondInvite(inv.id, "accept")}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respondingInviteId === inv.id}
                    onClick={() => void respondInvite(inv.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2 text-white">
          <PlusCircle className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-semibold">Create team</h2>
        </div>
        <Label htmlFor="team-name" className="text-slate-300">
          Team name
        </Label>
        <Input
          id="team-name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="CodeViva Builders"
          className="mt-2 border-white/10 bg-black/25 text-white"
        />
        <Button
          onClick={() => void createTeam()}
          disabled={creating}
          className="mt-4 w-full"
          variant="gradient"
        >
          {creating ? "Creating..." : "Create team"}
        </Button>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Your teams</p>
          {loading ? (
            <p className="text-sm text-slate-400">Loading teams...</p>
          ) : teams.length === 0 ? (
            <p className="text-sm text-slate-400">No teams yet.</p>
          ) : (
            <div className="space-y-2">
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    selectedTeamId === t.id
                      ? "border-indigo-400/50 bg-indigo-500/10 text-white"
                      : "border-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t.name}</span>
                    <span className="text-xs text-slate-400">
                      {t.members.length} members · {t.invites?.length ?? 0} pending
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2 text-white">
          <UserPlus className="h-4 w-4 text-violet-300" />
          <h2 className="text-lg font-semibold">Invite friend</h2>
        </div>
        <Label htmlFor="invite-email" className="text-slate-300">
          Friend email (recommended)
        </Label>
        <Input
          id="invite-email"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="friend@example.com"
          className="mt-2 border-white/10 bg-black/25 text-white"
        />
        <Label htmlFor="invite-github" className="mt-3 block text-slate-300">
          Or GitHub username
        </Label>
        <Input
          id="invite-github"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          placeholder="octocat"
          className="mt-2 border-white/10 bg-black/25 text-white"
        />
        <Button
          onClick={() => void inviteMember()}
          disabled={inviting || !selectedTeam}
          className="mt-4 w-full"
          variant="gradient"
        >
          {inviting ? "Inviting..." : "Invite to team"}
        </Button>
        <p className="mt-3 text-xs text-slate-400">
          GitHub invite works if friend has signed in with GitHub at least once.
        </p>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Pending outgoing invites</p>
          {!selectedTeam ? (
            <p className="text-sm text-slate-400">Select or create a team first.</p>
          ) : (selectedTeam.invites?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">No pending invites.</p>
          ) : (
            <div className="space-y-2">
              {selectedTeam.invites!.map((inv) => (
                <div key={inv.id} className="rounded-lg border border-white/10 px-3 py-2">
                  <p className="text-sm text-white">
                    {inv.inviteEmail ?? (inv.githubUsername ? `@${inv.githubUsername}` : "Unknown")}
                  </p>
                  <p className="text-xs text-slate-400">
                    Role: {inv.role} · by {inv.invitedBy.name ?? inv.invitedBy.email ?? "owner"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void copyInviteLink(inv)}>
                      Copy invite link
                    </Button>
                    {inv.inviteEmail && (
                      <Button size="sm" variant="outline" onClick={() => sendInviteEmail(inv)}>
                        Email invite
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <Users className="h-3.5 w-3.5" />
            Team members
          </p>
          {!selectedTeam ? (
            <p className="text-sm text-slate-400">Select or create a team first.</p>
          ) : selectedTeam.members.length === 0 ? (
            <p className="text-sm text-slate-400">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {selectedTeam.members.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-white">
                      {m.user.name ?? m.user.email ?? "Unknown"}
                    </p>
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">
                      {m.role}
                    </span>
                  </div>
                  {m.user.email && <p className="truncate text-xs text-slate-400">{m.user.email}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
