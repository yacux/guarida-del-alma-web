// ============================================================
// src/application/use-cases/get-course-page/GetCoursePageUseCase.output.dto.ts
// ============================================================

import type { Course } from "@/core/entities/Product";
import type { Announcement } from "@/core/entities/Announcement";
import type { UUID, ISODateString } from "@/core/entities/shared";

/**
 * Estado de un módulo desde la perspectiva del alumno.
 *
 * locked    → sin fila en student_module_progress
 * unlocked  → fila existe, is_unlocked=true, completed_at=null
 * completed → fila existe, completed_at no es null
 *             (el alumno entregó la tarea, independientemente de si fue aprobada)
 */
export type ModuleStatus = "locked" | "unlocked" | "completed";

/** Módulo enriquecido con el estado de progreso del alumno. */
export interface CourseModuleWithStatus {
  id: UUID;
  title: string;
  description: string | null;
  orderIndex: number;
  status: ModuleStatus;
  unlockedAt: ISODateString | null;
  completedAt: ISODateString | null;
}

export interface GetCoursePageOutput {
  course: Course;
  /** Módulos ordenados por orderIndex ASC, cada uno con su estado. */
  modules: CourseModuleWithStatus[];
  announcements: Announcement[];
}
