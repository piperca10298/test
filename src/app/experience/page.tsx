import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";
import { Scene3D } from "@/components/3d-scene";

const immersionLayers = [
  {
    title: "Intent Stream",
    description:
      "Watch cognition map into fluid prompts and UI actions without breaking creative flow.",
    icon: BrainCircuit,
  },
  {
    title: "Sensory Feedback",
    description:
      "Subtle visual pulses mirror neural stability, keeping the interface alive and readable.",
    icon: Waves,
  },
  {
    title: "Creative Amplification",
    description:
      "AI agents respond to focus shifts instantly, turning ideas into structured output on contact.",
    icon: Sparkles,
  },
];

export default function ExperiencePage() {
  return (
    <PageShell glowClassName="bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.28),transparent_62%)]">
      <section className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.96fr_1.04fr]">
            <Reveal className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                <span className="activity-dot size-2 rounded-full bg-cyan-300" />
                Immersive neural demo
              </div>

              <h1 className="headline-glow mt-8 font-display text-5xl font-semibold text-white sm:text-6xl">
                Enter the <span className="text-gradient-cyan">Neural Experience</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                This is NeuroGrid in motion: an interface where thought patterns,
                interface state, and AI output all move together in one luminous
                feedback loop.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/lab"
                  className="neuro-button-primary"
                >
                  Open the Lab
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/access"
                  className="neuro-button-secondary"
                >
                  Request Access
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Presence layers", value: "09" },
                  { label: "Response time", value: "12 ms" },
                  { label: "Signal fidelity", value: "Ultra" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="glass-panel metric-card rounded-3xl px-5 py-4"
                  >
                    <p className="text-2xl font-semibold text-white">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="glass-panel panel-hover panel-shine relative overflow-hidden rounded-[32px] p-5 sm:p-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.16),transparent_55%)]" />

                <div className="relative grid gap-5 lg:grid-cols-[1fr_14rem]">
                  <div className="relative flex min-h-[360px] items-center justify-center rounded-[28px] border border-white/10 sm:min-h-[430px]">
                    <Scene3D
                      className="h-[360px] sm:h-[430px]"
                      scale={1.22}
                      particleCount={42}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="glass-panel rounded-[24px] p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        Signal map
                      </p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        Thought routing stable
                      </p>
                    </div>
                    <div className="glass-panel rounded-[24px] p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        Cognitive state
                      </p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        Creative surge detected
                      </p>
                    </div>
                    <div className="glass-panel rounded-[24px] p-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="size-5 text-cyan-300" />
                        <p className="text-sm text-slate-300">
                          Secure neural translation layer active
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {immersionLayers.map((layer, index) => {
              const Icon = layer.icon;

              return (
                <Reveal key={layer.title} delay={index * 120}>
                  <article className="glass-panel panel-hover rounded-[28px] p-7">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                      <Icon className="size-6" />
                    </div>
                    <h2 className="mt-6 font-display text-2xl font-semibold text-white">
                      {layer.title}
                    </h2>
                    <p className="mt-4 text-base leading-8 text-slate-300">
                      {layer.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="glass-panel scan-surface mt-14 rounded-[32px] p-7 sm:p-8">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">
                    Neural flow timeline
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-semibold text-white">
                    Sense. Stabilize. Generate. Refine.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-slate-300">
                    Every interaction in the experience layer is built to show
                    how thought signals become structured AI responses in a
                    single, readable progression.
                  </p>
                </div>

                <div className="mt-2 flex flex-col gap-4 sm:mt-0 sm:flex-row sm:flex-wrap sm:gap-4">
                  {["Sense", "Stabilize", "Generate", "Refine"].map((phase) => (
                    <div
                      key={phase}
                      className="min-w-[10rem] flex-1 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 text-center text-sm uppercase tracking-[0.24em] text-slate-200"
                    >
                      {phase}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <PageNavigation currentHref="/experience" className="mt-14" />
        </div>
      </section>
    </PageShell>
  );
}
