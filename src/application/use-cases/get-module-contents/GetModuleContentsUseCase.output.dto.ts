// ============================================================
// src/application/use-cases/get-module-page/GetModuleContentsUseCase.output.dto.ts
// ============================================================

import type { Course } from "@/core/entities/Product";
import type {
  CourseModule,
  ModuleResource,
  ModuleAssignment,
} from "@/core/entities/Module";
import type { ModuleProgress } from "@/core/entities/StudentProgress";
import type {
  ModuleSubmission,
  ModuleSubmissionFeedback,
} from "@/core/entities/Submission";
import type { UUID } from "@/core/entities/shared";

/** Información de navegación entre módulos. */
export interface ModuleNav {
  /** order_index del módulo anterior. null si es el primero. */
  previousOrder: number | null;
  /** order_index del módulo siguiente. null si es el último. */
  nextOrder: number | null;
  /** Total de módulos del curso. Útil para "Módulo 3 de 6". */
  totalModules: number;
}

export interface GetModuleContentsOutput {
  /** Datos del curso padre (nombre, slug, etc.). Útil para breadcrumbs. */
  course: Course;

  /** El módulo solicitado. */
  module: CourseModule;

  /** Recursos del módulo ordenados por order_index. */
  resources: ModuleResource[];

  /** La tarea del módulo. null si no tiene tarea. */
  assignment: ModuleAssignment | null;

  /**
   * El último intento de entrega del alumno para esta tarea.
   * null si nunca entregó, o si no hay assignment.
   */
  latestSubmission: ModuleSubmission | null;

  /**
   * El feedback de Hebe sobre la última entrega.
   * null si Hebe todavía no corrigió.
   */
  feedback: ModuleSubmissionFeedback | null;

  /**
   * Estado del módulo para este alumno.
   * null si el módulo está bloqueado (sin fila en student_module_progress).
   */
  progress: ModuleProgress | null;

  /**
   * ¿Puede el alumno entregar (o re-entregar) la tarea ahora?
   * Calculado por submission.policy.ts en el use case.
   * false si no hay assignment.
   */
  canSubmit: boolean;

  /**
   * ID del enrollment a usar al crear una nueva entrega.
   * Viene de progress.enrollmentId (el mismo enrollment que desbloqueó el módulo,
   * sea de matrícula directa o de programa).
   * null si el módulo está bloqueado.
   */
  enrollmentId: UUID | null;

  /** Información para los botones de navegación anterior/siguiente. */
  nav: ModuleNav;
}
