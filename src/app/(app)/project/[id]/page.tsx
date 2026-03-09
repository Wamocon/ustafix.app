import { getProject } from "@/lib/actions/projects";
import { getDefects } from "@/lib/actions/defects";
import { DefectList } from "@/components/defect-list";
import { CaptureModal } from "@/components/capture-modal";
import { RealtimeWrapper } from "@/components/realtime-wrapper";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const [project, defects] = await Promise.all([
    getProject(id),
    getDefects(id),
  ]);

  if (!project) notFound();

  const counts = {
    offen: defects.filter((d) => d.status === "offen").length,
    in_arbeit: defects.filter((d) => d.status === "in_arbeit").length,
    erledigt: defects.filter((d) => d.status === "erledigt").length,
  };

  const total = defects.length;
  const donePercent = total > 0 ? Math.round((counts.erledigt / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="mb-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Projekte
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight">
          {project.name}
        </h1>
        {project.address && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-amber-500/60" />
            {project.address}
          </p>
        )}

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Fortschritt</span>
              <span className="font-semibold text-foreground">{donePercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
                style={{ width: `${donePercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatusBadge
            count={counts.offen}
            label="Offen"
            emoji="🔴"
            className="bg-status-open/8 text-status-open border border-status-open/15"
          />
          <StatusBadge
            count={counts.in_arbeit}
            label="In Arbeit"
            emoji="🟡"
            className="bg-status-progress/8 text-status-progress border border-status-progress/15"
          />
          <StatusBadge
            count={counts.erledigt}
            label="Erledigt"
            emoji="🟢"
            className="bg-status-done/8 text-status-done border border-status-done/15"
          />
        </div>
      </header>

      <RealtimeWrapper projectId={id} />
      <DefectList defects={defects} projectId={id} />
      <CaptureModal
        projectId={id}
        units={(project.units as { id: string; name: string }[]) ?? []}
      />
    </div>
  );
}

function StatusBadge({
  count,
  label,
  emoji,
  className,
}: {
  count: number;
  label: string;
  emoji: string;
  className: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center ${className}`}
    >
      <span className="text-lg">{emoji}</span>
      <span className="text-xl font-extrabold">{count}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  );
}
