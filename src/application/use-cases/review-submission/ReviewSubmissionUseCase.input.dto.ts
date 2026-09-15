// ============================================================
// src/application/use-cases/review-submission/ReviewSubmissionUseCase.input.dto.ts
// ============================================================

import type { UUID, ClerkUserId } from "@/core/entities/shared";

export interface ReviewSubmissionInput {
  submissionId: UUID;
  /** Clerk ID de Hebe (siempre admin). */
  reviewerId: ClerkUserId;
  feedbackText: string | null;
  /** 1-100. Validado acá y también con CHECK en DB. */
  score: number;
  /**
   * Nota mínima del curso para aprobar. Viene del SubmissionReviewItem
   * que la UI ya tiene en pantalla (evita una consulta extra al curso).
   */
  approvalMinScore: number;
}
