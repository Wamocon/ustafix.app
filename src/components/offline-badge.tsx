"use client";

import { WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOfflineSync } from "@/lib/offline/hooks";

export function OfflineBadge() {
  const { isOffline, isSyncing, pendingCount, failedCount, triggerSync } =
    useOfflineSync();

  const showBadge = isOffline || pendingCount > 0 || failedCount > 0;

  return (
    <AnimatePresence>
      {showBadge && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white shadow-lg"
          style={{
            background: isOffline
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : failedCount > 0
                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          }}
        >
          {isOffline ? (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              Offline – Keine Internetverbindung.
              {pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                  {pendingCount} ausstehend
                </span>
              )}
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Synchronisierung laeuft... ({pendingCount})
            </>
          ) : failedCount > 0 ? (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              {failedCount} fehlgeschlagen
              <button
                onClick={triggerSync}
                className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] hover:bg-white/30 transition-colors cursor-pointer"
              >
                Erneut versuchen
              </button>
            </>
          ) : pendingCount > 0 ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {pendingCount} werden synchronisiert...
            </>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
