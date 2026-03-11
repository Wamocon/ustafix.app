"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translations";
import { useCallback, useRef } from "react";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  const lastClick = useRef(0);
  const t = useTranslation();

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClick.current < 500) return;
    lastClick.current = now;
    onClick();
  }, [onClick]);

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-28 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-white shadow-xl shadow-amber-500/30 cursor-pointer animate-glow-pulse"
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.3 }}
      aria-label={t("capture.fabAria")}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </motion.button>
  );
}
