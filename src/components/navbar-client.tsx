"use client";

import Link from "next/link";
import { BrainCircuit, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { SessionUser } from "@/lib/auth";
import { navLinks } from "@/lib/site-data";

type NavbarClientProps = {
  user: SessionUser | null;
};

export function NavbarClient({ user }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const firstName = user?.name.split(" ")[0] ?? null;

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <nav className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <BrainCircuit className="size-5" />
            </span>
            <div>
              <span className="font-display text-xl font-semibold tracking-[0.24em] text-white">
                NeuroGrid
              </span>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Neural AI Platform
              </p>
            </div>
          </Link>

          <div className="hidden flex-wrap items-center justify-end gap-x-6 gap-y-3 text-xs uppercase tracking-[0.18em] text-slate-200 lg:flex">
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

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                  Hello, {firstName}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Logging Out" : "Logout"}
                </button>
              </>
            ) : (
              <Link href="/access" className="neuro-button-secondary">
                Login / Sign Up
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition-colors hover:border-cyan-400/30 hover:text-cyan-300 lg:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <div
          className={[
            "overflow-hidden transition-all duration-300 lg:hidden",
            isOpen ? "max-h-[34rem] opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/90 p-3 backdrop-blur-xl">
            <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              {user ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-200">Hello, {firstName}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Logging Out" : "Logout"}
                  </button>
                </div>
              ) : (
                <Link
                  href="/access"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-slate-950"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-cyan-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
