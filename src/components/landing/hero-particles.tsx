"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  c: string;
  s: number;
  a: number;
};

const CHARSET = "{}[]<>/;|&*#codeimportexportasyncawait";

export function HeroParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const { clientWidth, clientHeight } = canvas.parentElement ?? canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      ctx.scale(dpr, dpr);
      particles = Array.from({ length: 48 }, () => ({
        x: Math.random() * clientWidth,
        y: Math.random() * clientHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        c: CHARSET[Math.floor(Math.random() * CHARSET.length)] ?? "0",
        s: 10 + Math.random() * 14,
        a: 0.08 + Math.random() * 0.12,
      }));
    };

    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = "500 12px var(--font-geist-mono), ui-monospace, monospace";
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        ctx.fillStyle = `rgba(129, 140, 248, ${p.a})`;
        ctx.font = `500 ${p.s}px var(--font-geist-mono), ui-monospace, monospace`;
        ctx.fillText(p.c, p.x, p.y);
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
      aria-hidden
    />
  );
}
