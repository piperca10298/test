import type { LucideIcon } from "lucide-react";
import { Code2, Cpu, Rocket, Sparkles, Waves, Zap } from "lucide-react";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Experience", href: "/experience" },
  { label: "Lab", href: "/lab" },
  { label: "Chat", href: "/chat" },
  { label: "Access", href: "/access" },
];

export const immersiveRoutes = [
  {
    label: "Experience",
    href: "/experience",
    description:
      "Step into the floating interface and feel how NeuroGrid translates intent into motion.",
  },
  {
    label: "Lab",
    href: "/lab",
    description:
      "Inspect active neural processes, monitor system load, and test live AI workflows.",
  },
  {
    label: "Access",
    href: "/access",
    description:
      "Move through the future gateway for login, account creation, and secure team onboarding.",
  },
];

export type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const features: Feature[] = [
  {
    title: "Thought-to-Code Interface",
    description:
      "Translate intent into structured prompts, interface flows, and production-ready logic with a direct neural workflow.",
    icon: Code2,
  },
  {
    title: "Real-time Neural Sync",
    description:
      "Maintain low-latency alignment between your brain-computer device, collaborative workspaces, and active AI systems.",
    icon: Waves,
  },
  {
    title: "AI-Augmented Creativity",
    description:
      "Fuse intuition, memory, and generative assistance into one continuous creation loop for product, design, and research teams.",
    icon: Sparkles,
  },
];

export type Step = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const steps: Step[] = [
  {
    number: "01",
    title: "Connect your neural device",
    description:
      "Pair your headset or lab hardware with a secure NeuroGrid channel in a few seconds.",
    icon: Cpu,
  },
  {
    number: "02",
    title: "Sync with NeuroGrid",
    description:
      "Calibrate your signal, context, and intent so the platform can interpret mental input in real time.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Start creating instantly",
    description:
      "Launch into a thought-guided workspace where AI turns concepts into motion, copy, and code on command.",
    icon: Rocket,
  },
];
