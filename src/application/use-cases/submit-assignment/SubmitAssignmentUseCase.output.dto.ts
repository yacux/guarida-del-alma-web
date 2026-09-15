// ============================================================
// src/application/use-cases/submit-assignment/SubmitAssignmentUseCase.output.dto.ts
// ============================================================

import type { ModuleSubmission } from "@/core/entities/Submission";

export type SubmitAssignmentOutput =
  | { success: true; submission: ModuleSubmission }
  | { success: false; reason: SubmitAssignmentErrorReason };

export type SubmitAssignmentErrorReason =
  | "module_locked" // el módulo no está desbloqueado para este alumno
  | "cannot_resubmit" // ya hay una entrega aprobada o en revisión
  | "empty_answer" // la respuesta está vacía
  | "assignment_not_found";
