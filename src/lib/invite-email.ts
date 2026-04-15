type InviteEmailParams = {
  toEmail: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  expiresAt?: Date | null;
};

function isResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

export async function sendTeamInviteEmail(
  params: InviteEmailParams,
): Promise<{ sent: boolean; reason?: string }> {
  if (!isResendConfigured()) {
    return {
      sent: false,
      reason:
        "Email provider not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from = process.env.RESEND_FROM_EMAIL!.trim();
  const expires =
    params.expiresAt instanceof Date
      ? `This invite expires on ${params.expiresAt.toUTCString()}.`
      : "This invite may expire soon.";

  const text = [
    `Hi,`,
    ``,
    `${params.inviterName} invited you to join "${params.teamName}" on CodeViva.`,
    ``,
    `Accept invite: ${params.inviteUrl}`,
    ``,
    `${expires}`,
    ``,
    `If you did not expect this invite, you can ignore this email.`,
  ].join("\n");

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height:1.5; color:#111827;">
      <h2 style="margin:0 0 12px;">You're invited to CodeViva</h2>
      <p style="margin:0 0 12px;">
        <strong>${params.inviterName}</strong> invited you to join
        <strong>${params.teamName}</strong>.
      </p>
      <p style="margin:0 0 16px;">
        <a href="${params.inviteUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;">
          Accept invite
        </a>
      </p>
      <p style="margin:0 0 12px;color:#4b5563;">${expires}</p>
      <p style="margin:0;color:#6b7280;">If you did not expect this invite, you can ignore this email.</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.toEmail],
        subject: `Invite: Join ${params.teamName} on CodeViva`,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, reason: `Resend API error (${res.status}): ${body.slice(0, 180)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "Email send failed." };
  }
}

