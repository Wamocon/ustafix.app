"use client";

import { useState, useCallback, useRef } from "react";

interface QueueItem {
  id: string;
  file: File;
  defectId: string;
  projectId: string;
  status: "pending" | "uploading" | "done" | "error";
  retries: number;
}

const MAX_RETRIES = 3;

export function useUploadQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const processingRef = useRef(false);

  const addToQueue = useCallback(
    (file: File, defectId: string, projectId: string) => {
      const item: QueueItem = {
        id: crypto.randomUUID(),
        file,
        defectId,
        projectId,
        status: "pending",
        retries: 0,
      };
      setQueue((prev) => [...prev, item]);
    },
    []
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    setQueue((prev) => {
      const pending = prev.find((item) => item.status === "pending");
      if (!pending) {
        processingRef.current = false;
        return prev;
      }

      return prev.map((item) =>
        item.id === pending.id ? { ...item, status: "uploading" as const } : item
      );
    });

    processingRef.current = false;
  }, []);

  const pendingCount = queue.filter(
    (i) => i.status === "pending" || i.status === "uploading"
  ).length;
  const errorCount = queue.filter((i) => i.status === "error").length;

  return { queue, addToQueue, processQueue, pendingCount, errorCount };
}
