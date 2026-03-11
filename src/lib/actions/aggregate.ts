"use server";

import { getProjects, getProjectMembers } from "./projects";
import { getDefects } from "./defects";
import { getProtocols } from "./protocols";

export interface AggregateDefect {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  status: string;
  priority: string;
  unit_name: string | null;
  created_at: string;
}

export interface AggregateMember {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export interface AggregateProtocol {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  inspection_date: string;
  location: string | null;
  participants: string;
  pdf_storage_path: string | null;
  created_at: string;
  verdict_count: number;
}

export async function getAllDefects(): Promise<AggregateDefect[]> {
  const projects = await getProjects();
  if (!projects.length) return [];

  const results = await Promise.all(
    projects.map(async (p) => {
      const defects = await getDefects(p.id!);
      return defects.map((d: Record<string, unknown>) => ({
        id: d.id as string,
        project_id: p.id as string,
        project_name: p.name as string,
        title: d.title as string,
        status: d.status as string,
        priority: d.priority as string,
        unit_name:
          (d.units as { name: string } | null)?.name ?? null,
        created_at: d.created_at as string,
      }));
    })
  );

  return results
    .flat()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export async function getAllMembers(): Promise<AggregateMember[]> {
  const projects = await getProjects();
  if (!projects.length) return [];

  const results = await Promise.all(
    projects.map(async (p) => {
      const members = await getProjectMembers(p.id!);
      return members.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        user_id: m.user_id as string,
        project_id: p.id as string,
        project_name: p.name as string,
        full_name: (m.full_name as string) ?? null,
        email: (m.email as string) ?? null,
        role: m.role as string,
        created_at: m.created_at as string,
      }));
    })
  );

  return results.flat();
}

export async function getAllProtocols(): Promise<AggregateProtocol[]> {
  const projects = await getProjects();
  if (!projects.length) return [];

  const results = await Promise.all(
    projects.map(async (p) => {
      const protocols = await getProtocols(p.id!);
      return protocols.map((pr: Record<string, unknown>) => ({
        id: pr.id as string,
        project_id: p.id as string,
        project_name: p.name as string,
        title: pr.title as string,
        inspection_date: pr.inspection_date as string,
        location: (pr.location as string) ?? null,
        participants: pr.participants as string,
        pdf_storage_path: (pr.pdf_storage_path as string) ?? null,
        created_at: pr.created_at as string,
        verdict_count:
          (pr.protocol_defect_verdicts as unknown[] | null)?.length ?? 0,
      }));
    })
  );

  return results
    .flat()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
