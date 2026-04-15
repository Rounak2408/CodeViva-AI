import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { fetchGithubRepoFiles } from "@/lib/parse-repo";
import { runAnalysisPipeline } from "@/lib/analysis-pipeline";
import { defaultScanOptions, type ScanOptions } from "@/types/analysis";
import {
  jsonValue,
  resolveUserIdForScan,
} from "@/lib/scan-record";
import { ScanStatus } from "@/generated/prisma";
import { z } from "zod";

export const maxDuration = 300;
const githubUrlSchema = z.url().includes("github.com/");
const compareBodySchema = z
  .object({
    urlA: z.string().trim().min(1),
    urlB: z.string().trim().min(1),
    options: z
      .object({
        aiDetection: z.boolean().optional(),
        vivaQuestions: z.boolean().optional(),
        interviewQuestions: z.boolean().optional(),
        securityAudit: z.boolean().optional(),
        codeQuality: z.boolean().optional(),
        fastMode: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export async function POST(req: Request) {
  const session = await auth();
  const userId = await resolveUserIdForScan(
    session?.user?.id,
    session?.user?.email,
  );
  const raw = await req.json().catch(() => null);
  const checked = compareBodySchema.safeParse(raw);
  if (!checked.success) {
    return NextResponse.json(
      { error: "Invalid compare request body." },
      { status: 400 },
    );
  }
  const { urlA, urlB, options: optionsPatch } = checked.data;
  const options: ScanOptions = { ...defaultScanOptions, ...optionsPatch };

  if (
    !githubUrlSchema.safeParse(urlA).success ||
    !githubUrlSchema.safeParse(urlB).success
  ) {
    return NextResponse.json(
      { error: "Both urlA and urlB must be valid GitHub repository URLs." },
      { status: 400 },
    );
  }

  try {
    const [filesA, filesB] = await Promise.all([
      fetchGithubRepoFiles(urlA),
      fetchGithubRepoFiles(urlB),
    ]);
    const [resultA, resultB] = await Promise.all([
      runAnalysisPipeline(filesA, options),
      runAnalysisPipeline(filesB, options),
    ]);

    const [scanA, scanB] = await Promise.all([
      prisma.scan.create({
        data: {
          ...(userId ? { userId } : {}),
          sourceType: "github",
          sourceRef: urlA,
          status: ScanStatus.COMPLETE,
          progress: 100,
          result: jsonValue(resultA),
          title: `Compare A`,
        },
      }),
      prisma.scan.create({
        data: {
          ...(userId ? { userId } : {}),
          sourceType: "github",
          sourceRef: urlB,
          status: ScanStatus.COMPLETE,
          progress: 100,
          result: jsonValue(resultB),
          title: `Compare B`,
        },
      }),
    ]);

    const delta = {
      aiProbability: resultA.meta.aiProbability - resultB.meta.aiProbability,
      codeQuality: resultA.meta.codeQuality - resultB.meta.codeQuality,
      loc: resultA.meta.locEstimate - resultB.meta.locEstimate,
    };

    const comparison = await prisma.comparison.create({
      data: {
        ...(userId ? { userId } : {}),
        scanAId: scanA.id,
        scanBId: scanB.id,
        result: jsonValue({ delta }),
      },
    });

    return NextResponse.json({
      comparisonId: comparison.id,
      scanAId: scanA.id,
      scanBId: scanB.id,
      resultA,
      resultB,
      delta,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Compare failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
