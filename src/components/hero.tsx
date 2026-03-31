import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

import { Reveal } from "@/components/reveal";
import { Scene3D } from "@/components/3d-scene";

const highlights = [
  { label: "Signal stability", value: "99.98%" },
  { label: "Latency", value: "12 ms" },
  { label: "Creative boost", value: "4.2x" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-20 sm:pb-24 sm:pt-24">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <Reveal className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
            <span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
            Experimental neural interface
          </div>

          <h1 className="headline-glow mt-8 max-w-3xl font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Connect Your Mind to{" "}
            <span className="text-gradient-cyan">the Machine</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            NeuroGrid is a fictional experimental platform that links human
            thought to AI systems, turning raw intent into live creative output.
            Design, prototype, and build with a neural signal layer that feels
            instant, immersive, and precise.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/experience"
              className="neuro-button-primary"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/lab"
              className="neuro-button-secondary"
            >
              Explore the Lab
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="glass-panel metric-card rounded-3xl px-5 py-4"
              >
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-sm text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120} className="relative flex items-center justify-center">
          <div className="relative isolate flex w-full max-w-xl items-center justify-center px-2 sm:px-4 lg:min-h-[34rem]">
            <div className="pointer-events-none absolute left-6 top-16 h-56 w-56 rounded-full bg-cyan-300/[0.08] blur-3xl" />
            <div className="pointer-events-none absolute bottom-12 right-6 h-48 w-48 rounded-full bg-sky-400/[0.1] blur-3xl" />

            <div className="relative flex min-h-[26rem] w-full items-center justify-center sm:min-h-[30rem]">
              <Scene3D
                className="h-full min-h-[26rem] w-full sm:min-h-[30rem]"
                scale={1.08}
                particleCount={28}
              />
              <div className="pointer-events-none hero-ring absolute size-72 rounded-full border border-cyan-300/14" />
              <div
                className="pointer-events-none hero-ring absolute size-52 rounded-full border border-cyan-300/10"
                style={{ animationDelay: "350ms" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(8,145,178,0.06),transparent_52%)]" />

              <div className="pointer-events-none signal-card absolute left-0 top-6 glass-panel rounded-2xl px-4 py-3 text-sm text-slate-200 sm:left-2">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-4 text-cyan-300" />
                  <span>Encrypted thought routing</span>
                </div>
              </div>

              <div
                className="pointer-events-none signal-card absolute bottom-6 left-2 glass-panel rounded-2xl px-4 py-3 text-sm text-slate-200 sm:left-8"
                style={{ animationDelay: "1s" }}
              >
                <div className="flex items-center gap-3">
                  <Waves className="size-4 text-cyan-300" />
                  <span>Live neural resonance</span>
                </div>
              </div>

              <div
                className="pointer-events-none signal-card absolute right-0 top-14 glass-panel rounded-2xl px-4 py-3 text-sm text-slate-200 sm:right-2"
                style={{ animationDelay: "2s" }}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="size-4 text-amber-200" />
                  <span>AI ideation boost</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
