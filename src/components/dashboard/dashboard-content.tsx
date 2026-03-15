"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  Hammer,
  TrendingUp,
  UserCheck,
  Briefcase,
  Shield,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { StatCard } from "./stat-card";
import { ProjectHealthCard } from "./project-health-card";
import { ActivityFeed } from "./activity-feed";
import { LegalLinks } from "@/components/legal/legal-links";
import { AdminLegalConsentPanel } from "@/components/dashboard/admin-legal-consent-panel";
import { useTranslation } from "@/hooks/use-translations";
import type { DashboardData } from "@/lib/actions/dashboard";
import type { AdminLegalConsentOverview } from "@/lib/actions/legal";

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  manager: Briefcase,
  worker: Hammer,
};

interface DashboardContentProps {
  stats: DashboardData;
  adminLegalConsentOverview?: AdminLegalConsentOverview | null;
}

export function DashboardContent({
  stats,
  adminLegalConsentOverview,
}: DashboardContentProps) {
  const { highest_role: role, projects } = stats;
  const t = useTranslation();

  const ROLE_LABELS: Record<string, string> = {
    admin: t("dashboard.administrator"),
    manager: t("dashboard.bauleiter"),
    worker: t("dashboard.worker"),
  };

  const totals = projects.reduce(
    (acc, p) => ({
      defects: acc.defects + p.defect_counts.total,
      open: acc.open + p.defect_counts.offen,
      inProgress: acc.inProgress + p.defect_counts.in_arbeit,
      done: acc.done + p.defect_counts.erledigt,
      problem: acc.problem + p.defect_counts.problem,
      highPriority: acc.highPriority + p.priority_counts.hoch,
      members: acc.members + p.member_count,
      protocols: acc.protocols + p.protocol_count,
      pendingInvites: acc.pendingInvites + p.pending_invitations,
    }),
    {
      defects: 0,
      open: 0,
      inProgress: 0,
      done: 0,
      problem: 0,
      highPriority: 0,
      members: 0,
      protocols: 0,
      pendingInvites: 0,
    }
  );

  const completionRate =
    totals.defects > 0
      ? Math.round((totals.done / totals.defects) * 100)
      : 0;

  const allTransitions = projects.flatMap((p) =>
    p.recent_transitions.map((t) => ({
      ...t,
      projectId: p.id,
      projectName: p.name,
    }))
  );
  allTransitions.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const RoleIcon = ROLE_ICONS[role] ?? Hammer;
  const canCreate = role === "admin" || role === "manager";

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-border bg-card p-5 card-elevated"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <RoleIcon className="h-3.5 w-3.5 text-amber-600" />
              {ROLE_LABELS[role]}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">
              {t("dashboard.hello")}, {stats.user_name?.split(" ")[0] ?? ""}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && <CreateProjectDialog />}
          </div>
        </div>
      </motion.header>

      {/* Role-specific content */}
      {role === "admin" && (
        <AdminDashboard
          stats={stats}
          adminLegalConsentOverview={adminLegalConsentOverview ?? null}
          totals={totals}
          completionRate={completionRate}
          allTransitions={allTransitions}
          t={t}
        />
      )}
      {role === "manager" && (
        <ManagerDashboard
          stats={stats}
          totals={totals}
          completionRate={completionRate}
          allTransitions={allTransitions}
          t={t}
        />
      )}
      {role === "worker" && (
        <WorkerDashboard
          stats={stats}
          totals={totals}
          allTransitions={allTransitions}
          t={t}
        />
      )}
    </div>
  );
}

/* ─── Admin Dashboard ─── */

interface DashTotals {
  defects: number;
  open: number;
  inProgress: number;
  done: number;
  problem: number;
  highPriority: number;
  members: number;
  protocols: number;
  pendingInvites: number;
}

function AdminDashboard({
  stats,
  adminLegalConsentOverview,
  totals,
  completionRate,
  allTransitions,
  t,
}: {
  stats: DashboardData;
  adminLegalConsentOverview: AdminLegalConsentOverview | null;
  totals: DashTotals;
  completionRate: number;
  allTransitions: TransitionWithProject[];
  t: (key: string) => string;
}) {
  const isSingle = stats.projects.length === 1;
  const projectHref = isSingle
    ? `/project/${stats.projects[0].id}`
    : undefined;

  return (
    <>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("dashboard.projects")}
          value={stats.projects.length}
          icon={Building2}
          color="amber"
          delay={0}
          href={projectHref}
          onClick={isSingle ? undefined : () => scrollToId("admin-projects")}
        />
        <StatCard
          label={t("dashboard.totalDefects")}
          value={totals.defects}
          icon={LayoutDashboard}
          color="blue"
          delay={0.05}
          href="/dashboard/defects"
        />
        <StatCard
          label={t("dashboard.openDefects")}
          value={totals.open + totals.inProgress + totals.problem}
          icon={AlertTriangle}
          color="red"
          delay={0.1}
          subtitle={`${totals.highPriority} ${t("dashboard.highPriority")}`}
          href="/dashboard/defects?filter=offen"
        />
        <StatCard
          label={t("dashboard.completionRate")}
          value={`${completionRate}%`}
          icon={TrendingUp}
          color="green"
          delay={0.15}
          subtitle={`${totals.done} ${t("dashboard.ofDone")} ${totals.defects} ${t("dashboard.done")}`}
          href="/dashboard/defects"
        />
        <StatCard
          label={t("dashboard.teamMembers")}
          value={totals.members}
          icon={Users}
          color="purple"
          delay={0.2}
          subtitle={totals.pendingInvites > 0 ? `${totals.pendingInvites} ${t("dashboard.pendingInvites")}` : undefined}
          href="/dashboard/team"
        />
        <StatCard
          label={t("dashboard.protocols")}
          value={totals.protocols}
          icon={FileCheck}
          color="slate"
          delay={0.25}
          href="/dashboard/protocols"
        />
      </div>

      {/* Project Health */}
      <Section title={t("dashboard.projectOverview")} icon={Building2} id="admin-projects">
        <div className="space-y-3">
          {stats.projects.map((p, i) => (
            <ProjectHealthCard
              key={p.id}
              project={p}
              index={i}
              showTeamDetails
            />
          ))}
        </div>
      </Section>

      {/* Activity */}
      {allTransitions.length > 0 && (
        <Section title={t("dashboard.recentActivity")} icon={Clock}>
          {groupTransitionsByProject(allTransitions).map(
            ([projectId, projectName, transitions]) => (
              <ActivityFeed
                key={projectId}
                transitions={transitions}
                projectId={projectId}
                projectName={projectName}
              />
            )
          )}
        </Section>
      )}

      <Section title={t("dashboard.legalConsentOverview")} icon={ShieldCheck}>
        <AdminLegalConsentPanel overview={adminLegalConsentOverview} />
      </Section>

      <LegalLinksSection t={t} />
    </>
  );
}

/* ─── Manager Dashboard ─── */

function ManagerDashboard({
  stats,
  totals,
  completionRate,
  allTransitions,
  t,
}: {
  stats: DashboardData;
  totals: DashTotals;
  completionRate: number;
  allTransitions: TransitionWithProject[];
  t: (key: string) => string;
}) {
  const isSingle = stats.projects.length === 1;
  const projectHref = isSingle
    ? `/project/${stats.projects[0].id}`
    : undefined;

  return (
    <>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("dashboard.myProjects")}
          value={stats.projects.length}
          icon={Building2}
          color="amber"
          delay={0}
          href={projectHref}
          onClick={isSingle ? undefined : () => scrollToId("manager-projects")}
        />
        <StatCard
          label={t("dashboard.openDefects")}
          value={totals.open + totals.inProgress + totals.problem}
          icon={AlertTriangle}
          color="red"
          delay={0.05}
          subtitle={`${totals.highPriority} ${t("dashboard.highPriority")}`}
          href="/dashboard/defects?filter=offen"
        />
        <StatCard
          label={t("dashboard.completionRate")}
          value={`${completionRate}%`}
          icon={TrendingUp}
          color="green"
          delay={0.1}
          subtitle={`${totals.done} ${t("dashboard.ofDone")} ${totals.defects} ${t("dashboard.done")}`}
          href="/dashboard/defects"
        />
        <StatCard
          label={t("dashboard.teamMembers")}
          value={totals.members}
          icon={Users}
          color="purple"
          delay={0.15}
          subtitle={totals.pendingInvites > 0 ? `${totals.pendingInvites} ${t("dashboard.invitesOpen")}` : undefined}
          href="/dashboard/team"
        />
      </div>

      {/* Projects */}
      <Section title={t("dashboard.projectOverview")} icon={Building2} id="manager-projects">
        <div className="space-y-3">
          {stats.projects.map((p, i) => (
            <ProjectHealthCard
              key={p.id}
              project={p}
              index={i}
              showTeamDetails
            />
          ))}
        </div>
      </Section>

      {/* Activity */}
      {allTransitions.length > 0 && (
        <Section title={t("dashboard.recentActivity")} icon={Clock}>
          {groupTransitionsByProject(allTransitions).map(
            ([projectId, projectName, transitions]) => (
              <ActivityFeed
                key={projectId}
                transitions={transitions}
                projectId={projectId}
                projectName={projectName}
              />
            )
          )}
        </Section>
      )}

      <LegalLinksSection t={t} />
    </>
  );
}

/* ─── Worker Dashboard ─── */

function WorkerDashboard({
  stats,
  totals,
  allTransitions,
  t,
}: {
  stats: DashboardData;
  totals: DashTotals;
  allTransitions: TransitionWithProject[];
  t: (key: string) => string;
}) {
  const myOpenDefects = stats.projects.reduce(
    (acc, p) => acc + p.my_defects_open,
    0
  );
  const isSingle = stats.projects.length === 1;
  const projectHref = isSingle
    ? `/project/${stats.projects[0].id}`
    : undefined;

  return (
    <>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t("dashboard.myProjects")}
          value={stats.projects.length}
          icon={Building2}
          color="amber"
          delay={0}
          href={projectHref}
          onClick={isSingle ? undefined : () => scrollToId("worker-projects")}
        />
        <StatCard
          label={t("dashboard.myOpenDefects")}
          value={myOpenDefects}
          icon={Hammer}
          color="red"
          delay={0.05}
          href="/dashboard/defects?filter=offen"
        />
        <StatCard
          label={t("dashboard.capturedByMe")}
          value={stats.total_defects_by_me}
          icon={UserCheck}
          color="blue"
          delay={0.1}
          href="/dashboard/defects"
        />
        <StatCard
          label={t("dashboard.doneDefects")}
          value={totals.done}
          icon={CheckCircle2}
          color="green"
          delay={0.15}
          href="/dashboard/defects?filter=erledigt"
        />
      </div>

      {/* Projects */}
      <Section title={t("dashboard.myProjects")} icon={Building2} id="worker-projects">
        <div className="space-y-3">
          {stats.projects.map((p, i) => (
            <ProjectHealthCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </Section>

      {/* Activity */}
      {allTransitions.length > 0 && (
        <Section title={t("dashboard.recentChanges")} icon={Clock}>
          {groupTransitionsByProject(allTransitions).map(
            ([projectId, projectName, transitions]) => (
              <ActivityFeed
                key={projectId}
                transitions={transitions}
                projectId={projectId}
                projectName={projectName}
              />
            )
          )}
        </Section>
      )}

      <LegalLinksSection t={t} />
    </>
  );
}

function LegalLinksSection({ t }: { t: (key: string) => string }) {
  return (
    <Section title={t("common.legal")} icon={Scale}>
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("dashboard.legalAvailableAllRoles")}
        </p>
        <LegalLinks className="justify-start" />
      </div>
    </Section>
  );
}

/* ─── Shared ─── */

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Section({
  title,
  icon: Icon,
  children,
  id,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="space-y-3 scroll-mt-4"
    >
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <Icon className="h-4 w-4 text-amber-600" />
        <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </motion.section>
  );
}

type TransitionWithProject = {
  id: string;
  defect_id: string;
  defect_title: string;
  from_status: string;
  to_status: string;
  changed_by_name: string;
  created_at: string;
  projectId: string;
  projectName: string;
};

function groupTransitionsByProject(
  transitions: TransitionWithProject[]
): [string, string, TransitionWithProject[]][] {
  const map = new Map<string, [string, TransitionWithProject[]]>();
  for (const t of transitions) {
    const existing = map.get(t.projectId);
    if (existing) {
      existing[1].push(t);
    } else {
      map.set(t.projectId, [t.projectName, [t]]);
    }
  }
  return Array.from(map.entries()).map(([id, [name, items]]) => [
    id,
    name,
    items,
  ]);
}

