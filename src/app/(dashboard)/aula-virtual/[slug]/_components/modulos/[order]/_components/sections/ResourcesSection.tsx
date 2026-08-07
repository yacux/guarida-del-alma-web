// ============================================================
// src/app/(dashboard)/aula-virtual/_components/module/sections/ResourcesSection.tsx
//
// Lista los recursos de un módulo.
// Cada tipo de recurso tiene su propio ícono, color y acción.
// ============================================================

import {
  Video,
  FileText,
  Music,
  Download,
  ExternalLink,
  Clock,
} from "lucide-react";
import type { ModuleResource } from "@/core/entities/Module";
import { EmptyState } from "../../../../shared/EmptyState";

interface ResourcesSectionProps {
  resources: ModuleResource[];
}

// ── Config visual por tipo ────────────────────────────────────

const RESOURCE_CONFIG = {
  video: {
    icon: Video,
    iconColor: "text-guarida-fuchsia",
    iconBg: "bg-guarida-fuchsia/15",
    label: "Video",
    actionLabel: "Ver video",
  },
  pdf: {
    icon: FileText,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/15",
    label: "PDF",
    actionLabel: "Abrir PDF",
  },
  audio: {
    icon: Music,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/15",
    label: "Audio",
    actionLabel: "Escuchar",
  },
  download: {
    icon: Download,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/15",
    label: "Descargable",
    actionLabel: "Descargar",
  },
  external_link: {
    icon: ExternalLink,
    iconColor: "text-guarida-sky",
    iconBg: "bg-guarida-sky/15",
    label: "Enlace externo",
    actionLabel: "Visitar",
  },
} as const;

/** Formatea segundos a "mm:ss" o "h:mm:ss" */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── ResourceItem ─────────────────────────────────────────────

function ResourceItem({ resource }: { resource: ModuleResource }) {
  const config = RESOURCE_CONFIG[resource.resourceType];
  const Icon = config.icon;

  const isDownload = resource.resourceType === "download";

  return (
    <a
      href={resource.url}
      target={isDownload ? "_self" : "_blank"}
      rel="noopener noreferrer"
      download={isDownload}
      className="group flex items-center gap-4 rounded-xl border border-white/5 bg-guarida-dark-violet p-4 transition-all hover:border-white/15"
    >
      {/* Ícono */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
      >
        <Icon className={`h-5 w-5 ${config.iconColor}`} />
      </div>

      {/* Info */}
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

      {/* CTA */}
      <span className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 transition-all group-hover:border-white/20 group-hover:text-white/80">
        {config.actionLabel}
      </span>
    </a>
  );
}

// ── Sección ───────────────────────────────────────────────────

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  if (resources.length === 0) {
    return (
      <EmptyState
        title="Este módulo no tiene recursos todavía"
        description="El contenido estará disponible pronto."
      />
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-white">
        Recursos del módulo
      </h2>
      <div className="flex flex-col gap-2">
        {resources.map((resource) => (
          <ResourceItem key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}
