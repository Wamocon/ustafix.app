"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeDefects(projectId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`defects:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "defects",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, router]);
}
