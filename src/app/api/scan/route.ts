import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  extractZipFiles,
  fetchGithubRepoFiles,
  type RepoFile,
} from "@/lib/parse-repo";
import { runAnalysisPipeline } from "@/lib/analysis-pipeline";
import {
  defaultScanOptions,
  type ScanOptions,
} from "@/types/analysis";
import {
  jsonValue,
  optionsJson,
  prismaScanErrorMessage,
  resolveUserIdForScan,
} from "@/lib/scan-record";
import { ScanStatus } from "@/generated/prisma";
import { z } from "zod";

export const maxDuration = 300;
export const runtime = "nodejs";
const GITHUB_FETCH_TIMEOUT_MS = 150_000;
const githubUrlSchema = z.url().includes("github.com/");
const scanOptionsSchema = z
  .object({
    aiDetection: z.boolean().optional(),
    vivaQuestions: z.boolean().optional(),
    interviewQuestions: z.boolean().optional(),
    securityAudit: z.boolean().optional(),
    codeQuality: z.boolean().optional(),
    fastMode: z.boolean().optional(),
  })
  .strict();
const jsonBodySchema = z
  .object({
    sourceType: z.enum(["github", "zip"]),
    githubUrl: z.string().optional(),
    ufsUrl: z.string().optional(),
    fileName: z.string().optional(),
    options: scanOptionsSchema.optional(),
  })
  .strict();

async function fetchUploadedZip(ufsUrl: string): Promise<Buffer> {
  const res = await fetch(ufsUrl);
  if (!res.ok) {
    throw new Error("Could not download uploaded archive. Try again.");
  }
  return Buffer.from(await res.arrayBuffer());
}

async function finalizeScan(
  scanId: string,
  files: RepoFile[],
  options: ScanOptions,
) {
  await prisma.scan.update({
    where: { id: scanId },
    data: { progress: 55 },
  });

  const result = await runAnalysisPipeline(files, options);

  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: ScanStatus.COMPLETE,
      progress: 100,
      result: jsonValue(result),
      title:
        result.meta.techStack.slice(0, 3).join(" · ") || "Codebase scan",
    },
  });

  return result;
}

export async function POST(req: Request) {
  try {
    return await handleScanPost(req);
  } catch (e) {
    console.error("[api/scan]", e);
    return NextResponse.json(
      { error: prismaScanErrorMessage(e) },
      { status: 500 },
    );
  }
}

async function handleScanPost(req: Request) {
  const session = await auth();
  const userId = await resolveUserIdForScan(
    session?.user?.id,
    session?.user?.email,
  );
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const zip = form.get("zip");
    const optsRaw = form.get("options");

    let optionsPatch: Partial<ScanOptions> = {};
    if (optsRaw) {
      try {
        const parsed = JSON.parse(String(optsRaw));
        const checked = scanOptionsSchema.safeParse(parsed);
        if (!checked.success) {
          return NextResponse.json(
            { error: "Invalid scan options in form data." },
            { status: 400 },
          );
        }
        optionsPatch = checked.data;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON for form options." },
          { status: 400 },
        );
      }
    }
    const options: ScanOptions = { ...defaultScanOptions, ...optionsPatch };

    if (!(zip instanceof Blob)) {
      return NextResponse.json({ error: "Missing zip file." }, { status: 400 });
    }

    const scan = await prisma.scan.create({
      data: {
        ...(userId ? { userId } : {}),
        sourceType: "zip",
        sourceRef: (zip as File).name ?? "upload.zip",
        status: ScanStatus.PROCESSING,
        progress: 5,
        options: optionsJson(options),
      },
    });

    try {
      const buf = Buffer.from(await zip.arrayBuffer());
      await prisma.scan.update({
        where: { id: scan.id },
        data: { progress: 25 },
      });
      const files = extractZipFiles(buf);
      const result = await finalizeScan(scan.id, files, options);
      return NextResponse.json({ scanId: scan.id, result });
    } catch (e) {
      const message = prismaScanErrorMessage(e);
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: ScanStatus.FAILED,
          error: message,
          progress: 0,
        },
      });
      return NextResponse.json(
        { error: message, scanId: scan.id },
        { status: 422 },
      );
    }
  }

  let body: z.infer<typeof jsonBodySchema>;

  try {
    const raw = await req.json();
    const checked = jsonBodySchema.safeParse(raw);
    if (!checked.success) {
      return NextResponse.json(
        { error: "Invalid request body for scan." },
        { status: 400 },
      );
    }
    body = checked.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const options: ScanOptions = {
    ...defaultScanOptions,
    ...body.options,
  };

  const scan = await prisma.scan.create({
    data: {
      ...(userId ? { userId } : {}),
      sourceType: body.sourceType,
      sourceRef:
        body.sourceType === "github"
          ? body.githubUrl?.trim()
          : body.fileName ?? "upload.zip",
      status: ScanStatus.PROCESSING,
      progress: 5,
      options: optionsJson(options),
    },
  });

  try {
    let files: RepoFile[];
    if (body.sourceType === "github") {
      const url = body.githubUrl?.trim();
      if (!url) {
        throw new Error("GitHub URL is required.");
      }
      if (!githubUrlSchema.safeParse(url).success) {
        return NextResponse.json(
          { error: "Provide a valid GitHub repository URL." },
          { status: 400 },
        );
      }
      await prisma.scan.update({
        where: { id: scan.id },
        data: { progress: 25 },
      });
      files = await Promise.race([
        fetchGithubRepoFiles(url),
        new Promise<RepoFile[]>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "GitHub fetch timed out. Repo may be very large or rate-limited. Add GITHUB_TOKEN, try a smaller repo, or use ZIP upload.",
                ),
              ),
            GITHUB_FETCH_TIMEOUT_MS,
          ),
        ),
      ]);
    } else {
      if (!body.ufsUrl?.trim()) {
        throw new Error("Upload a ZIP file first or use direct file upload.");
      }
      await prisma.scan.update({
        where: { id: scan.id },
        data: { progress: 25 },
      });
      const buf = await fetchUploadedZip(body.ufsUrl);
      files = extractZipFiles(buf);
    }

    const result = await finalizeScan(scan.id, files, options);

    return NextResponse.json({ scanId: scan.id, result });
  } catch (e) {
    const message = prismaScanErrorMessage(e);
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: ScanStatus.FAILED,
        error: message,
        progress: 0,
      },
    });
    return NextResponse.json({ error: message, scanId: scan.id }, { status: 422 });
  }
}
