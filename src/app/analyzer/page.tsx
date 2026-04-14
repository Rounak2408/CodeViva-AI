import { AnalyzerClient } from "@/components/analyzer/analyzer-client";

export default async function AnalyzerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const defaultTab = sp.tab === "upload" ? "upload" : "github";
  return <AnalyzerClient defaultTab={defaultTab} />;
}
