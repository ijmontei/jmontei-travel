"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="will-change-transform"
        initial={{ opacity: 0, y: 0, filter: "blur(1px)" }}
        animate={{ opacity: 0, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 0, filter: "blur(px)" }}
        /*
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.4, ease: "easeOut" }
        }*/
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
