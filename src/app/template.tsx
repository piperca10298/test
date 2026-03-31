"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

type TemplateProps = {
  children: ReactNode;
};

export default function Template({ children }: TemplateProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 22, scale: 0.992, filter: "blur(10px)" }
      }
      animate={
        reduceMotion
          ? undefined
          : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
