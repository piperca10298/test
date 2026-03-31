import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { features } from "@/lib/site-data";

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-28 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Core Features"
            title="Built for direct thought-to-system collaboration"
            description="NeuroGrid compresses the gap between cognition and execution so ideas can become code, visuals, and decisions with almost no friction."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal key={feature.title} delay={index * 120}>
                <article className="glass-panel panel-hover panel-shine group h-full rounded-[28px] p-7">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-300">
                    {feature.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
