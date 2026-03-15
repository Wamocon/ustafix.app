import { getDashboardStats } from "@/lib/actions/dashboard";
import { getAdminLegalConsentOverview } from "@/lib/actions/legal";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { EmptyDashboard } from "@/components/dashboard/empty-dashboard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (!stats || stats.projects.length === 0) {
    const canCreate =
      !stats || stats.highest_role === "admin" || stats.highest_role === "manager";

    return <EmptyDashboard canCreate={canCreate} />;
  }

  const adminLegalConsentOverview =
    stats.highest_role === "admin"
      ? await getAdminLegalConsentOverview()
      : null;

  return (
    <DashboardContent
      stats={stats}
      adminLegalConsentOverview={adminLegalConsentOverview}
    />
  );
}
