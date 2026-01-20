"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function MotionCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="rounded-2xl border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 overflow-hidden shadow-sm hover:shadow-md"
      style={{ borderColor: "rgb(var(--border))" }}
    >
      {children}
    </motion.div>
  );
}
