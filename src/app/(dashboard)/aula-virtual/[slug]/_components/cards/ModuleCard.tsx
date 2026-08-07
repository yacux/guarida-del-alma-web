// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/ModuleCard.tsx
//
// Card de un módulo dentro de la lista del curso.
// Reutilizable desde cualquier vista que liste módulos.
// ============================================================

import Link from "next/link";
import { Lock, PlayCircle, CheckCircle2 } from "lucide-react";
import type { CourseModuleWithStatus } from "@/application/use-cases/get-course-page/GetCoursePageUseCase.output.dto";

interface ModuleCardProps {
  module: CourseModuleWithStatus;
  /** Slug del curso padre. Necesario para construir el href. */
  courseSlug: string;
  /** Número de módulo para mostrar al usuario (1-based). */
  moduleNumber: number;
}

// ── Config visual por estado ─────────────────────────────────

const STATUS_CONFIG = {
  locked: {
    iconBg: "bg-white/5",
    icon: <Lock className="h-5 w-5 text-white/25" />,
    border: "border-white/5",
    titleColor: "text-white/30",
    descColor: "text-white/20",
    numberColor: "text-white/20",
    badge: null,
    clickable: false,
  },
  unlocked: {
    iconBg: "bg-guarida-violet/20",
    icon: <PlayCircle className="h-5 w-5 text-guarida-fuchsia" />,
    border: "border-guarida-violet/30 hover:border-guarida-fuchsia/50",
    titleColor: "text-white",
    descColor: "text-white/50",
    numberColor: "text-white/40",
    badge: { label: "Disponible", class: "bg-guarida-violet/30 text-white/70" },
    clickable: true,
  },
  completed: {
    iconBg: "bg-guarida-sky/10",
    icon: <CheckCircle2 className="h-5 w-5 text-guarida-sky" />,
    border: "border-guarida-sky/20 hover:border-guarida-sky/40",
    titleColor: "text-white",
    descColor: "text-white/50",
    numberColor: "text-white/40",
    badge: { label: "Completado", class: "bg-guarida-sky/10 text-guarida-sky" },
    clickable: true,
  },
} as const;

export function ModuleCard({
  module,
  courseSlug,
  moduleNumber,
}: ModuleCardProps) {
  const config = STATUS_CONFIG[module.status];
  const href = `/aula-virtual/${courseSlug}/modulos/${module.orderIndex}`;

  const inner = (
    <div
      className={[
        "flex items-start gap-4 rounded-2xl border bg-guarida-dark-violet p-5",
        "transition-all duration-200",
        config.border,
        !config.clickable && "cursor-not-allowed opacity-60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Ícono de estado */}
      <div
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
      >
        {config.icon}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        {/* Número y badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs ${config.numberColor}`}>
            Módulo {moduleNumber}
          </span>
          {config.badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge.class}`}
            >
              {config.badge.label}
            </span>
          )}
        </div>

        {/* Título */}
        <p className={`font-semibold leading-snug ${config.titleColor}`}>
          {module.title}
        </p>

        {/* Descripción */}
        {module.description && (
          <p className={`line-clamp-2 text-sm ${config.descColor}`}>
            {module.description}
          </p>
        )}
      </div>
    </div>
  );

  // Los módulos bloqueados no son navegables
  if (!config.clickable) return inner;

  return <Link href={href}>{inner}</Link>;
}
