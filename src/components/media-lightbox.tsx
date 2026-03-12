"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Mic, Play } from "lucide-react";
import { createPortal } from "react-dom";

export interface LightboxItem {
  id: string;
  type: string;
  url: string;
}

interface MediaLightboxProps {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
}

export function MediaLightbox({ items, startIndex, onClose }: MediaLightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const current = items[index];

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : items.length - 1));
  }, [items.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < items.length - 1 ? i + 1 : 0));
  }, [items.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-black/95"
        onClick={onClose}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <span className="text-sm font-medium text-white/70">
            {index + 1} / {items.length}
          </span>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Media content */}
        <div
          className="flex flex-1 items-center justify-center overflow-hidden px-4 pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex max-h-full max-w-full items-center justify-center"
            >
              {current.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.url}
                  alt=""
                  className="max-h-[calc(100dvh-120px)] max-w-full rounded-lg object-contain select-none"
                  draggable={false}
                />
              )}
              {current.type === "video" && (
                <video
                  key={current.url}
                  src={current.url}
                  className="max-h-[calc(100dvh-120px)] max-w-full rounded-lg"
                  controls
                  autoPlay
                  playsInline
                />
              )}
              {current.type === "audio" && (
                <div className="flex flex-col items-center gap-6 rounded-2xl bg-white/10 p-10">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary">
                    <Mic className="h-10 w-10 text-white" />
                  </div>
                  <audio
                    key={current.url}
                    src={current.url}
                    controls
                    autoPlay
                    className="w-72 max-w-full"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

interface UseLightboxReturn {
  openLightbox: (index: number) => void;
  lightboxElement: React.ReactNode;
}

export function useLightbox(items: LightboxItem[]): UseLightboxReturn {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setOpenIndex(index);
  }, []);

  const lightboxElement =
    openIndex !== null && items.length > 0 ? (
      <MediaLightbox
        items={items}
        startIndex={openIndex}
        onClose={() => setOpenIndex(null)}
      />
    ) : null;

  return { openLightbox, lightboxElement };
}
