import { getDashboardStats } from "@/lib/actions/dashboard";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { HardHat } from "lucide-react";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (!stats || stats.projects.length === 0) {
    const canCreate =
      !stats || stats.highest_role === "admin" || stats.highest_role === "manager";

    return (
      <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
        <div className="relative flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-14 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-lg shadow-amber-500/20 animate-float">
            <HardHat className="h-10 w-10 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold">
              {canCreate ? "Noch keine Projekte" : "Willkommen!"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {canCreate
                ? "Erstellen Sie Ihr erstes Bauprojekt und legen Sie direkt los."
                : "Warte auf die Zuweisung zu einem Projekt durch deinen Bauleiter."}
            </p>
          </div>
          {canCreate && <CreateProjectDialog variant="inline" />}
        </div>
      </div>
    );
  }

  return <DashboardContent stats={stats} />;
}
