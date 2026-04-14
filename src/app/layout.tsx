import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/nav/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "https://codeviva.ai",
  ),
  title: {
    default: "CodeViva AI — GitHub & Code Folder Analyzer",
    template: "%s · CodeViva AI",
  },
  description:
    "AI-powered GitHub repository and code folder analyzer for teachers, recruiters, and students. Originality scores, viva & interview questions, security, architecture, and PDF reports.",
  keywords: [
    "code analysis",
    "GitHub analyzer",
    "viva questions",
    "interview questions",
    "AI code detection",
    "code quality",
    "education",
    "recruiting",
  ],
  openGraph: {
    title: "CodeViva AI — Understand Any Codebase in Seconds",
    description:
      "Analyze repositories, detect originality, generate viva and interview questions, and export premium PDF reports.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeViva AI",
    description:
      "AI-powered repository intelligence for teachers, recruiters, and students.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#0A0D14] font-sans text-foreground">
        <Providers>
          <SiteHeader />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="border-t border-white/[0.06] bg-[#0A0D14] py-8 sm:py-10 md:py-12">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
              <p className="text-xs font-medium tracking-wide text-zinc-500">
                © {new Date().getFullYear()} CodeViva AI · Production-grade code intelligence
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
