import Link from "next/link";
import { Activity, ArrowRight, Cpu, Database, Sparkles, Zap } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";

const processes = [
  { name: "Semantic drift calibration", load: 91, status: "Live" },
  { name: "Memory lattice indexing", load: 83, status: "Stable" },
  { name: "Intent clustering", load: 76, status: "Ramping" },
  { name: "Generative response mesh", load: 88, status: "Live" },
];

const modules = [
  {
    title: "Prompt Forge",
    description:
      "Transforms neural patterns into editable prompt graphs for design, code, and research workflows.",
    icon: Sparkles,
  },
  {
    title: "Signal Sandbox",
    description:
      "Stress-tests response behavior before a thought pattern is released into production systems.",
    icon: Activity,
  },
  {
    title: "Context Vault",
    description:
      "Stores experimental memory clusters, active sessions, and reusable cognitive presets.",
    icon: Database,
  },
];

export default function LabPage() {
  return (
    <PageShell glowClassName="bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_60%)]">
      <section className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-100">
                <span className="activity-dot size-2 rounded-full bg-amber-200" />
                Experimental AI lab
              </div>

              <h1 className="mt-8 font-display text-5xl font-semibold text-white sm:text-6xl">
                The <span className="text-gradient-cyan">NeuroGrid Lab</span> is
                where signals become systems
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Monitor active neural processes, validate AI behavior, and push
                new interaction models through a controlled experimental
                workspace.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/experience"
                  className="neuro-button-primary"
                >
                  Return to Experience
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/access"
                  className="neuro-button-secondary"
                >
                  Open Access Gateway
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Concurrent clusters", value: "24" },
                  { label: "Live experiments", value: "07" },
                  { label: "Health score", value: "97%" },
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
              <div className="glass-panel panel-hover panel-shine rounded-[32px] p-5 sm:p-7">
                <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="glass-panel rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Active neural processes
                        </p>
                        <h2 className="mt-3 font-display text-2xl font-semibold text-white">
                          Live stack monitor
                        </h2>
                      </div>
                      <Cpu className="size-8 text-cyan-300" />
                    </div>

                    <div className="mt-6 space-y-4">
                      {processes.map((process, index) => (
                        <div
                          key={process.name}
                          className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">
                                {process.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {process.status}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-cyan-300">
                              {process.load}%
                            </span>
                          </div>

                          <div className="mt-4 h-2 rounded-full bg-white/6">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-200"
                              style={{
                                width: `${process.load}%`,
                                transitionDelay: `${index * 120}ms`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="glass-panel scan-surface rounded-[28px] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            System activity
                          </p>
                          <h2 className="mt-3 font-display text-2xl font-semibold text-white">
                            Diagnostic field
                          </h2>
                        </div>
                        <Zap className="size-7 text-amber-200" />
                      </div>

                      <div className="mt-6 grid gap-3">
                        {[68, 92, 54, 81, 73, 97].map((level, index) => (
                          <div
                            key={`${level}-${index}`}
                            className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="activity-dot size-2 rounded-full bg-cyan-300" />
                              <div className="h-2 flex-1 rounded-full bg-white/6">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-400"
                                  style={{ width: `${level}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel rounded-[28px] p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Event stream
                      </p>
                      <div className="mt-5 space-y-3">
                        {[
                          "00:12:08  Context lattice refreshed",
                          "00:12:11  Prompt Forge emitted a new branch",
                          "00:12:15  Response mesh latency normalized",
                          "00:12:20  Sandbox checkpoint committed",
                        ].map((event) => (
                          <div
                            key={event}
                            className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                          >
                            {event}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {modules.map((module, index) => {
              const Icon = module.icon;

              return (
                <Reveal key={module.title} delay={index * 120}>
                  <article className="glass-panel panel-hover rounded-[28px] p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                        <Icon className="size-6" />
                      </div>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-200">
                        Ready
                      </span>
                    </div>
                    <h2 className="mt-6 font-display text-2xl font-semibold text-white">
                      {module.title}
                    </h2>
                    <p className="mt-4 text-base leading-8 text-slate-300">
                      {module.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>

          <PageNavigation currentHref="/lab" className="mt-14" />
        </div>
      </section>
    </PageShell>
  );
}
