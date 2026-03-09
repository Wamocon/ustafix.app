import { getProjects } from "@/lib/actions/projects";
import { ProjectCard } from "@/components/project-card";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { HardHat, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Projekte
              </h1>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.length}{" "}
              {projects.length === 1 ? "Projekt" : "Projekte"} aktiv
            </p>
          </div>
          <CreateProjectDialog />
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-14 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-lg shadow-amber-500/20 animate-float">
            <HardHat className="h-10 w-10 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold">Noch keine Projekte</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Erstellen Sie Ihr erstes Bauprojekt und legen Sie direkt los.
            </p>
          </div>
          <CreateProjectDialog variant="inline" />
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: Record<string, unknown>, i: number) => (
            <ProjectCard
              key={project.id as string}
              project={project}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
