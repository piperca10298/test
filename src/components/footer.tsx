import Link from "next/link";

import { navLinks } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>{"\u00A9"} {new Date().getFullYear()} NeuroGrid. All rights reserved.</p>
        <div className="flex flex-wrap gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-300 hover:text-cyan-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
