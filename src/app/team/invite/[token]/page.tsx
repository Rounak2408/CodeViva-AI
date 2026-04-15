import { redirect } from "next/navigation";

export default async function TeamInviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/team?invite=${encodeURIComponent(token)}`);
}
