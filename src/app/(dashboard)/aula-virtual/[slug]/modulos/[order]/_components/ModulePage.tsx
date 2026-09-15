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
import { AssignmentForm } from "./AssignmentForm";

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
    enrollmentId,
    nav,
  } = result;

  // El form solo se renderiza cuando el use case determinó
  // que el alumno puede entregar o re-entregar.
  // enrollmentId no debería ser null si canSubmit=true
  // (canSubmit ya implica progress !== null → enrollmentId !== null),
  // pero el chequeo defensivo evita un runtime error si algo cambia.
  const formSlot =
    canSubmit && assignment && enrollmentId ? (
      <AssignmentForm
        assignmentId={assignment.id}
        moduleId={module.id}
        enrollmentId={enrollmentId}
        courseSlug={courseSlug}
        moduleOrder={module.orderIndex}
        isRecovery={latestSubmission !== null}
      />
    ) : null;

  console.log("ESTO ES:" + (canSubmit && assignment && enrollmentId));

  return (
    <div className="px-8 py-12 border border-guarida-dark-violet/20 bg-guarida-dark-violet/80 rounded-2xl max-w-4xl mx-auto w-full flex flex-col gap-10">
      {/* ===================================================== */}
      {/* Hero del módulo */}
      {/* ===================================================== */}

      <section className="space-y-3 ">
        <div className="inline-flex rounded-full border border-guarida-violet/30 bg-guarida-dark-violet/50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-guarida-sky">
          Módulo {module.orderIndex + 1}
        </div>

        <h1 className="text-3xl font-bold text-white">{module.title}</h1>

        {module.description && (
          <p className="max-w-3xl text-base leading-relaxed text-white/80">
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
        formSlot={formSlot}
      />

      {/* ===================================================== */}
      {/* Navegación inferior */}
      {/* ===================================================== */}

      <ModuleNav nav={nav} courseSlug={courseSlug} position="bottom" />
    </div>
  );
}
