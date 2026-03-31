import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { immersiveRoutes } from "@/lib/site-data";

type PageNavigationProps = {
  currentHref: string;
  className?: string;
};

export function PageNavigation({
  currentHref,
  className,
}: PageNavigationProps) {
  return (
    <div
      className={["grid gap-4 md:grid-cols-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      {immersiveRoutes.map((route) => {
        const isActive = route.href === currentHref;

        return (
          <Link
            key={route.href}
            href={route.href}
            className={[
              "glass-panel panel-shine group rounded-[28px] p-5 transition-all duration-300",
              isActive
                ? "border-cyan-300/35 bg-cyan-400/[0.08]"
                : "panel-hover hover:border-cyan-400/25",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-display text-2xl font-semibold text-white">
                {route.label}
              </span>
              <ArrowRight className="size-5 text-cyan-300 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {route.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
