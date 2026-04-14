"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Dialog } from "@base-ui/react/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type AuthModalMode = "login" | "signup" | null;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function strengthScore(password: string): { pct: number; label: string } {
  if (!password) return { pct: 0, label: "Enter a password" };
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  const pct = Math.min(100, score);
  let label = "Weak";
  if (pct >= 75) label = "Strong";
  else if (pct >= 50) label = "Good";
  else if (pct >= 25) label = "Fair";
  return { pct, label };
}

type OAuthConfig = { google: boolean; github: boolean };

export function AuthModals({
  mode,
  onClose,
  onSwitchMode,
}: {
  mode: AuthModalMode;
  onClose: () => void;
  onSwitchMode: (m: "login" | "signup") => void;
}) {
  const open = mode !== null;
  const [oauth, setOauth] = React.useState<OAuthConfig>({
    google: false,
    github: false,
  });

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/oauth-providers");
        const j = (await res.json()) as OAuthConfig;
        if (!cancelled) setOauth(j);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[100] bg-black/70 backdrop-blur-md transition-opacity",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Viewport className="fixed inset-0 z-[100] flex max-h-[100dvh] items-end justify-center overflow-y-auto p-0 pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-4">
          <Dialog.Popup
            className={cn(
              "relative flex w-full max-w-lg shadow-2xl outline-none",
              "data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
              "transition-[transform,opacity] duration-200 ease-out",
              "rounded-t-[1.75rem] border border-white/[0.08] bg-[#0f1219]/95 sm:rounded-2xl sm:border-white/[0.08]",
              "max-h-[min(92dvh,880px)] min-h-0 flex-col overflow-hidden backdrop-blur-2xl",
              "lg:max-w-4xl lg:flex-row",
            )}
          >
            <aside className="hidden shrink-0 flex-col justify-center border-b border-white/[0.06] bg-gradient-to-b from-indigo-500/10 via-transparent to-fuchsia-500/5 p-8 lg:flex lg:w-[280px] lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300/90">
                CodeViva AI
              </p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400">
                {[
                  "Secure login with modern encryption",
                  "GitHub repo privacy respected in scans",
                  "Instant analysis after you sign in",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-emerald-400/90">✔</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="relative flex min-h-0 flex-1 flex-col">
              <Dialog.Close
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "absolute top-3 right-3 z-10 rounded-xl text-zinc-400 hover:text-white",
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Dialog.Close>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-12 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-10">
                <AnimatePresence mode="wait">
                  {mode === "login" && (
                    <LoginPanel
                      key="login"
                      oauth={oauth}
                      onSwitchSignup={() => onSwitchMode("signup")}
                    />
                  )}
                  {mode === "signup" && (
                    <SignupPanel
                      key="signup"
                      oauth={oauth}
                      onSwitchLogin={() => onSwitchMode("login")}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LoginPanel({
  oauth,
  onSwitchSignup,
}: {
  oauth: OAuthConfig;
  onSwitchSignup: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErr: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      nextErr.email = "Enter a valid email";
    if (password.length < 6) nextErr.password = "At least 6 characters";
    setErrors(nextErr);
    if (Object.keys(nextErr).length) return;
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/analyzer",
      });
      const authFailed = Boolean(res?.error) || res?.url?.includes("error=");
      if (authFailed) {
        toast.error("Invalid email or password.");
        return;
      }
      toast.success("Welcome back");
      window.location.assign("/analyzer");
      return;
    } finally {
      setLoading(false);
    }
  }

  async function oauthSign(provider: "google" | "github") {
    if (provider === "google" && !oauth.google) {
      toast.message("Google sign-in", {
        description: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.",
      });
      return;
    }
    if (provider === "github" && !oauth.github) {
      toast.message("GitHub sign-in", {
        description: "Add GITHUB_ID and GITHUB_SECRET to enable.",
      });
      return;
    }
    await signIn(provider, { callbackUrl: "/analyzer" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      className="mx-auto w-full max-w-md"
    >
      <Dialog.Title className="text-2xl font-semibold tracking-tight text-white">
        Welcome back
      </Dialog.Title>
      <Dialog.Description className="mt-2 text-sm leading-relaxed text-zinc-400">
        Sign in to continue analyzing repositories.
      </Dialog.Description>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-zinc-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "h-11 rounded-xl border-white/[0.1] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/40",
                errors.email && "border-rose-500/50",
              )}
              placeholder="you@company.com"
            />
          </div>
          {errors.email && <p className="text-xs text-rose-400">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-zinc-300">
              Password
            </Label>
            <button
              type="button"
              className="text-xs font-medium text-indigo-400/90 hover:text-indigo-300"
              onClick={() =>
                toast.message("Password reset", {
                  description: "Configure email delivery to enable reset links.",
                })
              }
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              id="login-password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "h-11 rounded-xl border-white/[0.1] bg-white/[0.04] pr-11 pl-10 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/40",
                errors.password && "border-rose-500/50",
              )}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-400">{errors.password}</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border border-white/20 bg-white/[0.06] text-indigo-500 focus:ring-indigo-500/40"
          />
          Remember me{" "}
          <span className="text-xs text-zinc-600">— session lasts up to 30 days</span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          variant="gradient"
          className="h-11 w-full rounded-xl shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Continue with Email
        </Button>
      </form>

      <div className="my-8 flex items-center gap-3">
        <Separator className="flex-1 bg-white/[0.08]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Or</span>
        <Separator className="flex-1 bg-white/[0.08]" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void oauthSign("google")}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-11 w-full rounded-xl border-white/[0.1] bg-white/[0.03] text-zinc-100 hover:bg-white/[0.08]",
          )}
        >
          <GoogleIcon className="mr-2 h-5 w-5" />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => void oauthSign("github")}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-11 w-full rounded-xl border-white/[0.1] bg-white/[0.03] text-zinc-100 hover:bg-white/[0.08]",
          )}
        >
          <GitHubIcon className="mr-2 h-5 w-5" />
          Continue with GitHub
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="font-semibold text-indigo-400 hover:text-indigo-300"
          onClick={onSwitchSignup}
        >
          Sign up
        </button>
      </p>
    </motion.div>
  );
}

function SignupPanel({
  oauth,
  onSwitchLogin,
}: {
  oauth: OAuthConfig;
  onSwitchLogin: () => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [agree, setAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { pct, label } = strengthScore(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Valid email required";
    if (password.length < 8) next.password = "At least 8 characters";
    else if (!/[A-Z]/.test(password)) next.password = "Include an uppercase letter";
    else if (!/[a-z]/.test(password)) next.password = "Include a lowercase letter";
    else if (!/[0-9]/.test(password)) next.password = "Include a number";
    else if (!/[^A-Za-z0-9]/.test(password)) next.password = "Include a symbol";
    if (password !== confirm) next.confirm = "Passwords don't match";
    if (!agree) next.agree = "Accept the terms to continue";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const text = await res.text();
      let data: { error?: string; ok?: boolean } = {};
      try {
        data = text ? (JSON.parse(text) as { error?: string; ok?: boolean }) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        const fallback =
          res.status >= 500
            ? `Server error (${res.status}). Check terminal logs and database.`
            : `Request failed (${res.status})`;
        toast.error(data.error?.trim() || fallback);
        return;
      }
      const sign = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/analyzer",
      });
      const authFailed = Boolean(sign?.error) || sign?.url?.includes("error=");
      if (authFailed) {
        toast.error("Account created. Sign in manually.");
        onSwitchLogin();
        return;
      }
      toast.success("Account created — you’re in.");
      window.location.assign("/analyzer");
      return;
    } finally {
      setLoading(false);
    }
  }

  async function oauthSign(provider: "google" | "github") {
    if (provider === "google" && !oauth.google) {
      toast.message("Google sign-in", {
        description: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.",
      });
      return;
    }
    if (provider === "github" && !oauth.github) {
      toast.message("GitHub sign-in", {
        description: "Add GITHUB_ID and GITHUB_SECRET to enable.",
      });
      return;
    }
    await signIn(provider, { callbackUrl: "/analyzer" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      className="mx-auto w-full max-w-md"
    >
      <Dialog.Title className="text-2xl font-semibold tracking-tight text-white">
        Create your account
      </Dialog.Title>
      <Dialog.Description className="mt-2 text-sm leading-relaxed text-zinc-400">
        Start analyzing codebases like a pro.
      </Dialog.Description>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="su-name" className="text-zinc-300">
            Full name
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              id="su-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "h-11 rounded-xl border-white/[0.1] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-600",
                errors.name && "border-rose-500/50",
              )}
              placeholder="Ada Lovelace"
            />
          </div>
          {errors.name && <p className="text-xs text-rose-400">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="su-email" className="text-zinc-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              id="su-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "h-11 rounded-xl border-white/[0.1] bg-white/[0.04] pl-10 text-white placeholder:text-zinc-600",
                errors.email && "border-rose-500/50",
              )}
              placeholder="you@company.com"
            />
          </div>
          {errors.email && <p className="text-xs text-rose-400">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="su-password" className="text-zinc-300">
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              id="su-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "h-11 rounded-xl border-white/[0.1] bg-white/[0.04] pr-11 pl-10 text-white",
                errors.password && "border-rose-500/50",
              )}
            />
            <button
              type="button"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06]"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-zinc-500">Strength: {label}</span>
            <span className="text-xs tabular-nums text-zinc-600">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5 bg-white/[0.06]" />
          {errors.password && <p className="text-xs text-rose-400">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="su-confirm" className="text-zinc-300">
            Confirm password
          </Label>
          <Input
            id="su-confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={cn(
              "h-11 rounded-xl border-white/[0.1] bg-white/[0.04] text-white",
              errors.confirm && "border-rose-500/50",
            )}
          />
          {errors.confirm && <p className="text-xs text-rose-400">{errors.confirm}</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border border-white/20 bg-white/[0.06]"
          />
          <span>
            I agree to the{" "}
            <Link href="/" className="text-indigo-400 hover:underline">
              Terms
            </Link>{" "}
            &amp;{" "}
            <Link href="/" className="text-indigo-400 hover:underline">
              Privacy
            </Link>
          </span>
        </label>
        {errors.agree && <p className="text-xs text-rose-400">{errors.agree}</p>}

        <Button
          type="submit"
          disabled={loading}
          variant="gradient"
          className="h-11 w-full rounded-xl shadow-lg shadow-indigo-500/25"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Create account
        </Button>
      </form>

      <div className="my-8 flex items-center gap-3">
        <Separator className="flex-1 bg-white/[0.08]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Or</span>
        <Separator className="flex-1 bg-white/[0.08]" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void oauthSign("google")}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-11 w-full rounded-xl border-white/[0.1] bg-white/[0.03] text-zinc-100",
          )}
        >
          <GoogleIcon className="mr-2 h-5 w-5" />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => void oauthSign("github")}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-11 w-full rounded-xl border-white/[0.1] bg-white/[0.03] text-zinc-100",
          )}
        >
          <GitHubIcon className="mr-2 h-5 w-5" />
          Continue with GitHub
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <button
          type="button"
          className="font-semibold text-indigo-400 hover:text-indigo-300"
          onClick={onSwitchLogin}
        >
          Log in
        </button>
      </p>
    </motion.div>
  );
}
