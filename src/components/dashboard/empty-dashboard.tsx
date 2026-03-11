"use client";

import { UstafixLogo } from "@/components/ustafix-logo";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { useTranslation } from "@/hooks/use-translations";

interface EmptyDashboardProps {
  canCreate: boolean;
}

export function EmptyDashboard({ canCreate }: EmptyDashboardProps) {
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="relative flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-14 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl overflow-hidden shadow-lg shadow-amber-500/20 animate-float">
          <UstafixLogo className="h-full w-full" />
        </div>
        <div>
          <p className="text-lg font-bold">
            {canCreate ? t("dashboard.noProjects") : t("dashboard.welcome")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate
              ? t("dashboard.emptySubtitle")
              : t("dashboard.waitForAssignment")}
          </p>
        </div>
        {canCreate && <CreateProjectDialog variant="inline" />}
      </div>
    </div>
  );
}
