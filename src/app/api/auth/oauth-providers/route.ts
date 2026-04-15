import { NextResponse } from "next/server";

/** Which OAuth providers are configured (for showing buttons in the auth UI). */
export function GET() {
  const githubClientId =
    process.env.GITHUB_CLIENT_ID?.trim() ?? process.env.GITHUB_ID?.trim();
  const githubClientSecret =
    process.env.GITHUB_CLIENT_SECRET?.trim() ?? process.env.GITHUB_SECRET?.trim();

  return NextResponse.json({
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() &&
        process.env.GOOGLE_CLIENT_SECRET?.trim(),
    ),
    github: Boolean(githubClientId && githubClientSecret),
  });
}
