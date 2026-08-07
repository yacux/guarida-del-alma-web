// ============================================================
// src/application/use-cases/get-module-page/GetModuleContentsUseCase.input.dto.ts
// ============================================================

import type { ClerkUserId } from "@/core/entities/shared";

export interface GetModuleContentsInput {
  /** Slug del curso padre. Viene de la URL: /aula-virtual/amor-propio */
  courseSlug: string;
  /**
   * Posición del módulo dentro del curso (0-based).
   * Viene del segmento de ruta: /aula-virtual/amor-propio/modulos/2
   */
  moduleOrder: number;
  /** ID del alumno autenticado. */
  studentId: ClerkUserId;
}
