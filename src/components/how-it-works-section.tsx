import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { steps } from "@/lib/site-data";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-28 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="How It Works"
            title="A fast loop from neural input to AI output"
            description="The NeuroGrid workflow is designed to feel immediate: connect your device, stabilize the signal, and move from intent to execution in moments."
          />
        </Reveal>

        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent lg:block" />

          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <Reveal key={step.number} delay={index * 140}>
                  <article className="glass-panel panel-hover panel-shine relative h-full rounded-[28px] p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-display text-sm font-semibold tracking-[0.3em] text-cyan-300/80">
                        {step.number}
                      </span>
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                        <Icon className="size-5" />
                      </div>
                    </div>

                    <h3 className="mt-8 font-display text-2xl font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-base leading-8 text-slate-300">
                      {step.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
