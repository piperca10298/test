import type { ReactNode } from "react";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

type PageShellProps = {
  children: ReactNode;
  glowClassName?: string;
  mainClassName?: string;
  showFooter?: boolean;
};

export function PageShell({
  children,
  glowClassName,
  mainClassName,
  showFooter = true,
}: PageShellProps) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-overlay" />
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-[38rem]",
          glowClassName ??
            "bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.26),transparent_58%)]",
        ].join(" ")}
      />
      <div className="ambient-orb pointer-events-none absolute -left-20 top-32 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="ambient-orb pointer-events-none absolute right-[-8rem] top-44 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl [animation-delay:1.8s]" />
      <div className="ambient-orb pointer-events-none absolute bottom-10 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-cyan-400/[0.08] blur-3xl [animation-delay:0.9s]" />
      <div className="aurora-ribbon pointer-events-none absolute inset-x-[-10%] top-28 h-56" />
      <Navbar />
      <main className={["relative z-10 flex-1", mainClassName].filter(Boolean).join(" ")}>
        {children}
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
