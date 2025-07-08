"use client";
import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface Props {
  children: ReactNode;
}

import type { Variants } from "framer-motion";

const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

export default function PageTransition({ children }: Props) {
  const pathname = usePathname();
  const shouldFade = pathname === '/articles' || pathname.startsWith('/post/');
  if (!shouldFade) return <>{children}</>; // no animation for other pages

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
