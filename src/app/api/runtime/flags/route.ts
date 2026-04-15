import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasGithubToken: Boolean(process.env.GITHUB_TOKEN?.trim()),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    fastScanDefault: true,
  });
}
