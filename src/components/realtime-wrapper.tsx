"use client";

import { useRealtimeDefects } from "@/hooks/use-realtime";

export function RealtimeWrapper({ projectId }: { projectId: string }) {
  useRealtimeDefects(projectId);
  return null;
}
