// ============================================================
// src/app/(dashboard)/aula-virtual/_components/workshop/WorkshopResourcesSection.tsx
// ============================================================

import { Video, FileText, Music, Clock } from "lucide-react";
import type { ResolvedWorkshopResource } from "@/application/use-cases/get-workshop-page/GetWorkshopPageUseCase.output.dto";
import { EmptyState } from "../shared/EmptyState";

const CONFIG = {
  video: {
    icon: Video,
    color: "text-guarida-fuchsia",
    bg: "bg-guarida-fuchsia/15",
    label: "Video",
  },
  pdf: {
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-400/15",
    label: "PDF",
  },
  audio: {
    icon: Music,
    color: "text-purple-400",
    bg: "bg-purple-400/15",
    label: "Audio",
  },
} as const;

function formatDuration(s: number): string {
  const m = Math.floor(s / 60),
    sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function WorkshopResourcesSection({
  resources,
}: {
  resources: ResolvedWorkshopResource[];
}) {
  if (resources.length === 0) {
    return (
      <EmptyState
        title="Sin recursos todavía"
        description="El contenido estará disponible pronto."
      />
    );
  }

  return (
    <section className="px-8 py-12 border border-guarida-dark-violet/20 bg-guarida-dark-violet/20 rounded-2xl">
      <h2 className="mb-3 text-base font-semibold text-white">
        Recursos del taller
      </h2>
      <div className="flex flex-col gap-3">
        {resources.map((r) => {
          const c = CONFIG[r.resourceType];
          const Icon = c.icon;
          const isPdf = r.resourceType === "pdf";

          return (
            <div
              key={r.id}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-guarida-dark-violet p-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg}`}
              >
                <Icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {r.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{c.label}</span>
                  {r.durationSeconds != null && (
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Clock className="h-3 w-3" />
                      {formatDuration(r.durationSeconds)}
                    </span>
                  )}
                </div>
              </div>
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 hover:border-white/20 hover:text-white/80"
                >
                  {isPdf
                    ? "Ver PDF"
                    : r.resourceType === "video"
                      ? "Ver video"
                      : "Escuchar"}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
