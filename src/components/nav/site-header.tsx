"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, LogOut, Menu, Sparkles, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CommandPaletteHint } from "@/components/command-palette";
import { AuthModals, type AuthModalMode } from "@/components/auth/auth-modals";
import { cn } from "@/lib/utils";

const links = [
  { href: "/analyzer", label: "Analyzer" },
  { href: "/compare", label: "Compare" },
  { href: "/history", label: "History" },
  { href: "/team", label: "Team" },
];

function firstName(name?: string | null, email?: string | null): string {
  const safeName = name?.trim();
  if (safeName) return safeName.split(/\s+/)[0] ?? "User";
  const local = email?.split("@")[0]?.trim();
  return local || "User";
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const userFirstName = firstName(session?.user?.name, session?.user?.email);
  const [authMode, setAuthMode] = useState<AuthModalMode>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0D14]/75 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0A0D14]/60">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 6, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30"
          >
            <Sparkles className="h-4 w-4 text-white" />
          </motion.div>
          <span className="text-sm font-semibold tracking-tight text-white sm:text-base">CodeViva AI</span>
        </Link>

        {session?.user && (
          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === l.href ? "text-white" : "text-zinc-400 hover:text-white",
                )}
              >
                {pathname === l.href && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <CommandPaletteHint />
          {status === "loading" ? (
            <div className="h-11 w-28 animate-pulse rounded-full bg-white/[0.04]" />
          ) : session?.user ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-11 max-w-[140px] rounded-full border-white/[0.12] bg-white/[0.03] px-3 text-zinc-100 shadow-none backdrop-blur-sm transition hover:border-white/[0.2] hover:bg-white/[0.08] sm:max-w-[170px] sm:h-10",
                  )}
                >
                  <span className="truncate text-xs font-medium sm:text-sm">{userFirstName}</span>
                  <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem className="text-xs text-zinc-500" disabled>
                    Signed in as {userFirstName}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={loggingOut}
                    onClick={() => void handleLogout()}
                    className="text-rose-300 focus:text-rose-200"
                  >
                    {loggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-11 rounded-full border-white/[0.12] bg-white/[0.03] px-4 text-zinc-100 shadow-none backdrop-blur-sm transition hover:border-white/[0.2] hover:bg-white/[0.08] hover:shadow-[0_0_20px_-4px_rgba(99,102,241,0.45)] sm:h-10",
              )}
            >
              <User className="mr-1.5 h-3.5 w-3.5 opacity-90" />
              Login
            </button>
          )}

          {session?.user && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-lg" }),
                  "text-zinc-300 md:hidden",
                )}
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] border-l border-white/[0.08] bg-[#0f1219]/95 p-0">
                <SheetHeader className="border-b border-white/[0.08] px-5 py-4">
                  <SheetTitle className="text-white">Navigation</SheetTitle>
                  <SheetDescription>Open your workspace sections</SheetDescription>
                </SheetHeader>
                <div className="space-y-2 p-4">
                  {links.map((l) => (
                    <button
                      key={l.href}
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        router.push(l.href);
                      }}
                      className={cn(
                        "flex h-11 w-full items-center rounded-xl border border-white/[0.08] px-4 text-left text-sm font-medium transition",
                        pathname === l.href
                          ? "bg-white/[0.1] text-white"
                          : "bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]",
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={() => {
                      setMobileOpen(false);
                      void handleLogout();
                    }}
                    className="flex h-11 w-full items-center rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 text-left text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    {loggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <AuthModals
        mode={authMode}
        onClose={() => setAuthMode(null)}
        onSwitchMode={setAuthMode}
      />
    </header>
  );
}
