// ============================================================
// src/app/(dashboard)/aula-virtual/_components/course/sections/ModuleListSection.tsx
//
// Sección que lista todos los módulos de un curso con su estado.
// Solo renderiza — no tiene lógica de negocio.
// ============================================================

import type { CourseModuleWithStatus } from "@/application/use-cases/get-course-page/GetCoursePageUseCase.output.dto";
import { ModuleCard } from "../../cards/ModuleCard";
import { EmptyState } from "../../shared/EmptyState";

interface ModuleListSectionProps {
  modules: CourseModuleWithStatus[];
  courseSlug: string;
}

export function ModuleListSection({
  modules,
  courseSlug,
}: ModuleListSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-white">Módulos del curso</h2>
        <span className="text-sm text-white/40">
          {modules.filter((m) => m.status === "completed").length} de{" "}
          {modules.length} completados
        </span>
      </div>

      {modules.length === 0 ? (
        <EmptyState
          title="Este curso todavía no tiene módulos"
          description="El contenido estará disponible pronto."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              courseSlug={courseSlug}
              moduleNumber={index + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
