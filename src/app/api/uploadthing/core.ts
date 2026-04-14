import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  zipUploader: f({
    "application/zip": { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => ({
      ufsUrl: file.ufsUrl,
      key: file.key,
      name: file.name,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
