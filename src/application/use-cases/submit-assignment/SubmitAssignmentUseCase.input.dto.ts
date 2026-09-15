// ============================================================
// src/application/use-cases/submit-assignment/SubmitAssignmentUseCase.input.dto.ts
// ============================================================

import type { UUID, ClerkUserId } from "@/core/entities/shared";

export interface SubmitAssignmentInput {
  assignmentId: UUID;
  /**
   * Necesario para verificar que el módulo está desbloqueado.
   * Viene de result.module.id (GetModulePageUseCase).
   */
  moduleId: UUID;
  studentId: ClerkUserId;
  /**
   * El enrollment que desbloqueó el módulo (directo o de programa).
   * Viene de result.enrollmentId (GetModulePageUseCase).
   */
  enrollmentId: UUID;
  /**
   * La respuesta libre del alumno al trabajo descrito en el PDF.
   * Sin preguntas estructuradas: siempre [respuesta] (array de 1 elemento).
   * La DB mantiene JSONB array para compatibilidad y extensibilidad.
   */
  answers: string[];
}
