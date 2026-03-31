import { FeaturesSection } from "@/components/features-section";
import { Hero } from "@/components/hero";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { PageShell } from "@/components/page-shell";

export default function Home() {
  return (
    <PageShell>
      <>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
      </>
    </PageShell>
  );
}
