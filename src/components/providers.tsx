"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { CommandPaletteProvider } from "@/components/command-palette";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <TooltipProvider>
          <CommandPaletteProvider>
            {children}
            <Toaster richColors position="top-right" />
          </CommandPaletteProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
