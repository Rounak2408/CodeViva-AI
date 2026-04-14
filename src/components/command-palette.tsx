"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  FolderGit,
  History,
  LayoutGrid,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ElementType;
};

const COMMANDS: Cmd[] = [
  {
    id: "analyzer",
    label: "Analyzer",
    hint: "Scan a repo",
    href: "/analyzer",
    icon: FolderGit,
  },
  { id: "compare", label: "Compare", hint: "Two repos", href: "/compare", icon: BarChart3 },
  { id: "history", label: "History", hint: "Past scans", href: "/history", icon: History },
  { id: "team", label: "Team", hint: "Collaboration", href: "/team", icon: Users },
];

type PaletteCtx = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
};
const Ctx = createContext<PaletteCtx | null>(null);

export function useCommandPalette() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return c;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <Ctx.Provider value={{ open, setOpen, toggle }}>
      {children}
      <CommandPaletteInner />
    </Ctx.Provider>
  );
}

function CommandPaletteInner() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(s) ||
        c.hint?.toLowerCase().includes(s) ||
        c.id.includes(s),
    );
  }, [q]);

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      setQ("");
      router.push(href);
    },
    [router, setOpen],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const onNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[active]) {
        e.preventDefault();
        run(filtered[active]!.href);
      }
    };
    window.addEventListener("keydown", onNav);
    return () => window.removeEventListener("keydown", onNav);
  }, [open, filtered, active, run]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111827]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Search pages…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              <kbd className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
                esc
              </kbd>
            </div>
            <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">No matches</p>
              ) : (
                filtered.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => run(c.href)}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        i === active
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-300 hover:bg-white/[0.04]",
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-indigo-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="font-medium">{c.label}</span>
                        {c.hint && (
                          <span className="ml-2 text-xs text-zinc-500">{c.hint}</span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-violet-400" />
                CodeViva
              </span>
              <span>
                <kbd className="rounded border border-white/10 bg-white/5 px-1">↑</kbd>
                <kbd className="ml-1 rounded border border-white/10 bg-white/5 px-1">↓</kbd>
                navigate ·{" "}
                <kbd className="rounded border border-white/10 bg-white/5 px-1">↵</kbd> open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CommandPaletteHint() {
  const { setOpen } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-zinc-500 transition hover:border-white/15 hover:text-zinc-300 lg:flex"
    >
      <LayoutGrid className="h-3.5 w-3.5" />
      <kbd className="font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}
