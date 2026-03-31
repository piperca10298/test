import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { AccessAuthPanel } from "@/components/access-auth-panel";
import { PageNavigation } from "@/components/page-navigation";
import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";

export default async function AccessPage() {
  const user = await getSessionUser();

  return (
    <PageShell glowClassName="bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_60%)]">
      <section className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <Reveal className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                <span className="activity-dot size-2 rounded-full bg-cyan-300" />
                Secure gateway
              </div>

              <h1 className="mt-8 font-display text-5xl font-semibold text-white sm:text-6xl">
                Access <span className="text-gradient-cyan">NeuroGrid</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Create an account, log in, and keep a real authenticated session
                across the NeuroGrid interface. The access layer now stores user
                records, hashes passwords, and keeps your identity available in
                the app chrome.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/experience" className="neuro-button-primary">
                  Preview Experience
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/lab" className="neuro-button-secondary">
                  Visit the Lab
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Auth mode", value: user ? "Live" : "Ready" },
                  { label: "Database", value: "SQLite" },
                  { label: "Session", value: "Cookie" },
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
              <div className="glass-panel panel-hover panel-shine rounded-[32px] p-6 sm:p-8">
                <AccessAuthPanel initialUser={user} />
              </div>
            </Reveal>
          </div>

          <PageNavigation currentHref="/access" className="mt-14" />
        </div>
      </section>
    </PageShell>
  );
}
