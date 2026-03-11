"use server";

import { createClient } from "@/lib/supabase/server";
import { claimPendingInvitations } from "./invitations";

export interface DefectCounts {
  offen: number;
  in_arbeit: number;
  erledigt: number;
  total: number;
}

export interface PriorityCounts {
  hoch: number;
  mittel: number;
  niedrig: number;
}

export interface MemberRoles {
  admin: number;
  manager: number;
  worker: number;
}

export interface RecentTransition {
  id: string;
  defect_id: string;
  defect_title: string;
  from_status: string;
  to_status: string;
  changed_by_name: string;
  created_at: string;
}

export interface ProjectStats {
  id: string;
  name: string;
  address: string | null;
  status: string;
  my_role: string;
  created_at: string;
  defect_counts: DefectCounts;
  priority_counts: PriorityCounts;
  member_count: number;
  member_roles: MemberRoles;
  pending_invitations: number;
  protocol_count: number;
  my_defects_open: number;
  recent_transitions: RecentTransition[];
}

export interface DashboardData {
  user_id: string;
  user_name: string;
  highest_role: "admin" | "manager" | "worker";
  projects: ProjectStats[];
  total_defects_by_me: number;
}

export async function getDashboardStats(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Claim any pending invitations so new users see their projects immediately
  await claimPendingInvitations();

  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error) {
    console.error("Dashboard stats error:", error);
    return null;
  }

  return data as DashboardData;
}
