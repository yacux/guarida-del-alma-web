// ============================================================
// src/app/(dashboard)/aula-virtual/_components/module/sections/ModuleNav.tsx
//
// Botones de navegación anterior / siguiente entre módulos.
// Reutilizable en la parte superior e inferior de la página.
// ============================================================

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ModuleNav as ModuleNavData } from "@/application/use-cases/get-module-contents/GetModuleContentsUseCase.output.dto";

interface ModuleNavProps {
  nav: ModuleNavData;
  courseSlug: string;
  /** Posición en la página: top muestra solo flechas, bottom muestra labels */
  position?: "top" | "bottom";
}

export function ModuleNav({
  nav,
  courseSlug,
  position = "bottom",
}: ModuleNavProps) {
  const baseHref = `/aula-virtual/${courseSlug}/modulos`;

  const prevHref =
    nav.previousOrder !== null ? `${baseHref}/${nav.previousOrder}` : null;

  const nextHref =
    nav.nextOrder !== null ? `${baseHref}/${nav.nextOrder}` : null;

  return (
    <nav className="flex items-center justify-between">
      {/* Módulo anterior */}
      {prevHref ? (
        <Link
          href={prevHref}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-guarida-dark-violet px-4 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-guarida-violet/50 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {position === "bottom" && (
            <span>Módulo {nav.previousOrder! + 1}</span>
          )}
        </Link>
      ) : (
        // Placeholder para mantener el layout con justify-between
        <div />
      )}

      {/* Contador central */}
      <span className="text-xs text-white/30">
        {/* orderIndex es 0-based, el módulo actual es previousOrder + 1 o nextOrder - 1 */}
        {nav.previousOrder !== null
          ? nav.previousOrder + 2
          : nav.nextOrder !== null
            ? nav.nextOrder
            : 1}{" "}
        de {nav.totalModules}
      </span>

      {/* Módulo siguiente */}
      {nextHref ? (
        <Link
          href={nextHref}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-guarida-dark-violet px-4 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-guarida-violet/50 hover:text-white"
        >
          {position === "bottom" && <span>Módulo {nav.nextOrder! + 1}</span>}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
