"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import type { SessionUser } from "@/lib/auth";

type AccessAuthPanelProps = {
  initialUser: SessionUser | null;
};

type AuthMode = "login" | "signup";

const initialFormState = {
  name: "",
  email: "",
  password: "",
};

export function AccessAuthPanel({ initialUser }: AccessAuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const handleChange = (field: keyof typeof initialFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/auth/${mode}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "signup"
              ? form
              : {
                  email: form.email,
                  password: form.password,
                },
          ),
        });

        const data = (await response.json().catch(() => null)) as
          | { message?: string; user?: SessionUser }
          | null;

        if (!response.ok) {
          setError(data?.message ?? "Something went wrong. Please try again.");
          return;
        }

        setUser(data?.user ?? null);
        setForm(initialFormState);
        router.refresh();
      } catch {
        setError("Unable to reach NeuroGrid right now. Please try again.");
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });

        setUser(null);
        setForm(initialFormState);
        setError(null);
        setMode("login");
        router.refresh();
      } catch {
        setError("Unable to close your session right now. Please try again.");
      }
    });
  };

  if (user) {
    return (
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
            <ShieldCheck className="size-4 text-cyan-300" />
            Session Active
          </div>

          <h2 className="mt-8 font-display text-4xl font-semibold text-white">
            Welcome back, <span className="text-gradient-cyan">{user.name}</span>
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            Your Neural session is live. You can head into the immersive
            product experience or log out from here at any time.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/experience" className="neuro-button-primary">
              Enter Experience
              <ArrowRight className="size-4" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="neuro-button-secondary"
            >
              {isPending ? "Logging Out" : "Logout"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel panel-hover rounded-[28px] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Authenticated user
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Name: {user.name}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Email: {user.email}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Session status
            </p>
            <div className="mt-4 space-y-3">
              {[
                "Persistent cookie session enabled",
                "Password secured with bcrypt hashing",
                "SQLite-backed user record stored",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
          <ShieldCheck className="size-4 text-cyan-300" />
          Access Gateway
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={
              mode === "login" ? "neuro-button-primary" : "neuro-button-secondary"
            }
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={
              mode === "signup"
                ? "neuro-button-primary"
                : "neuro-button-secondary"
            }
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Name
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Enter your name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
                className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/30 focus:bg-white/[0.05]"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/30 focus:bg-white/[0.05]"
            />
          </label>

          <label className="block">
            <span className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Password
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              placeholder="Enter your password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/30 focus:bg-white/[0.05]"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="neuro-button-primary w-full"
          >
            {isPending
              ? mode === "signup"
                ? "Creating Account"
                : "Logging In"
              : mode === "signup"
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          {mode === "signup"
            ? "Create your account to store an identity in the NeuroGrid database and start a live session immediately."
            : "Log in with your existing Neural ID to restore your cookie-backed session."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="glass-panel panel-hover rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Security posture
          </p>
          <div className="mt-4 space-y-3">
            {[
              "Passwords hashed with bcrypt",
              "Session persisted with signed cookies",
              "User profile stored in SQLite through Prisma",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Session flow
          </p>
          <div className="mt-4 space-y-3">
            {[
              "Create account -> store user -> open session",
              "Login -> verify password -> refresh navbar state",
              "Logout -> clear cookie -> return to anonymous mode",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
