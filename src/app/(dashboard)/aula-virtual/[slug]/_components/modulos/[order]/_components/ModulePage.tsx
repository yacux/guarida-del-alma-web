// ============================================================
// src/app/(dashboard)/aula-virtual/[slug]/_components/module/ModulePage.tsx
//
// Compositor de la vista de un módulo.
//
// Responsabilidades:
// • Mostrar la información principal del módulo.
// • Renderizar recursos.
// • Renderizar la tarea (si existe).
// • Mostrar navegación entre módulos.
//
// No contiene lógica de negocio.
// No consulta Supabase.
// No conoce Clerk.
// ============================================================

import type { GetModuleContentsOutput } from "@/application/use-cases/get-module-contents/GetModuleContentsUseCase.output.dto";

import { ModuleNav } from "./sections/ModuleNav";
import { ResourcesSection } from "./sections/ResourcesSection";
import { AssignmentSection } from "./sections/AssignmentSection";

interface ModulePageProps {
  result: GetModuleContentsOutput;
  courseSlug: string;
}

export function ModulePage({ result, courseSlug }: ModulePageProps) {
  const {
    module,
    resources,
    assignment,
    latestSubmission,
    feedback,
    canSubmit,
    nav,
  } = result;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
      {/* ===================================================== */}
      {/* Hero del módulo */}
      {/* ===================================================== */}

      <section className="space-y-3">
        <div className="inline-flex rounded-full border border-guarida-violet/30 bg-guarida-violet/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-guarida-sky">
          Módulo {module.orderIndex + 1}
        </div>

        <h1 className="text-3xl font-bold text-white">{module.title}</h1>

        {module.description && (
          <p className="max-w-3xl text-base leading-relaxed text-white/60">
            {module.description}
          </p>
        )}
      </section>

      {/* ===================================================== */}
      {/* Navegación superior */}
      {/* ===================================================== */}

      <ModuleNav nav={nav} courseSlug={courseSlug} position="top" />

      {/* ===================================================== */}
      {/* Recursos */}
      {/* ===================================================== */}

      <ResourcesSection resources={resources} />

      {/* ===================================================== */}
      {/* Tarea */}
      {/* ===================================================== */}

      <AssignmentSection
        assignment={assignment}
        latestSubmission={latestSubmission}
        feedback={feedback}
        canSubmit={canSubmit}
      />

      {/* ===================================================== */}
      {/* Navegación inferior */}
      {/* ===================================================== */}

      <ModuleNav nav={nav} courseSlug={courseSlug} position="bottom" />
    </div>
  );
}
