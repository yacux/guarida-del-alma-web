// ============================================================
// src/app/(dashboard)/aula-virtual/_components/module/sections/ResourcesSection.tsx
//
// Lista los recursos de un módulo.
//
// Tipos soportados:
// • Video
// • PDF
// • Audio
//
// Los PDFs pueden visualizarse y descargarse.
// ============================================================

import {
  Video,
  FileText,
  Music,
  Download,
  ExternalLink,
  Clock,
} from "lucide-react";

import { EmptyState } from "../../../../../[slug]/_components/shared/EmptyState";
import { ResolvedModuleResource } from "@/application/use-cases/get-module-contents/GetModuleContentsUseCase.output.dto";

interface ResourcesSectionProps {
  resources: ResolvedModuleResource[];
}

// ── Config visual por tipo ────────────────────────────────────

const RESOURCE_CONFIG = {
  video: {
    icon: Video,
    iconColor: "text-guarida-fuchsia",
    iconBg: "bg-guarida-fuchsia/15",
    label: "Video",
  },

  pdf: {
    icon: FileText,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/15",
    label: "PDF",
  },

  audio: {
    icon: Music,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/15",
    label: "Audio",
  },
} as const;

// ── Formatea segundos ─────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── ResourceItem ──────────────────────────────────────────────

function ResourceItem({ resource }: { resource: ResolvedModuleResource }) {
  const config = RESOURCE_CONFIG[resource.resourceType];
  const Icon = config.icon;

  const isPdf = resource.resourceType === "pdf";

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/5 bg-guarida-dark-violet p-4 transition-all hover:border-white/15">
      {/* Ícono */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
      >
        <Icon className={`h-5 w-5 ${config.iconColor}`} />
      </div>

      {/* Información */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <p className="truncate text-sm font-medium text-white">
          {resource.title}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">{config.label}</span>

          {resource.durationSeconds != null && (
            <span className="flex items-center gap-1 text-xs text-white/30">
              <Clock className="h-3 w-3" />
              {formatDuration(resource.durationSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* ── Acciones ───────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Solo mostramos los botones si hay una URL válida */}
        {resource.url ? (
          <>
            {/* ── PDF: visualizar ──────────────────────────────── */}
            {isPdf && (
              <>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver PDF
                </a>

                <a
                  href={resource.url}
                  download
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </a>
              </>
            )}

            {/* ── Video ───────────────────────────────────────── */}
            {resource.resourceType === "video" && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80"
              >
                Ver video
              </a>
            )}

            {/* ── Audio ───────────────────────────────────────── */}
            {resource.resourceType === "audio" && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80"
              >
                Escuchar
              </a>
            )}
          </>
        ) : (
          /* Opcional: Mostrar un mensaje o estado de "Procesando" si la URL es null */
          <span className="text-xs text-white/40">No disponible</span>
        )}
      </div>
    </div>
  );
}

// ── Sección ───────────────────────────────────────────────────

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  if (resources.length === 0) {
    return (
      <EmptyState
        title="No hay recursos todavía"
        description="Este módulo todavía no tiene recursos disponibles."
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-white">
        Recursos del módulo
      </h2>

      <div className="flex flex-col gap-3">
        {resources.map((resource) => (
          <ResourceItem key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}
