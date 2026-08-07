// ============================================================
// src/application/use-cases/get-course-page/GetCoursePageUseCase.input.dto.ts
// ============================================================

import type { ClerkUserId } from "@/core/entities/shared";

export interface GetCoursePageInput {
  /** Slug del curso. Viene de la URL: /aula-virtual/amor-propio */
  courseSlug: string;
  /** ID del alumno autenticado. Necesario para calcular el progreso. */
  studentId: ClerkUserId;
}
