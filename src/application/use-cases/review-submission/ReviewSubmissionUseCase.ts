// ============================================================
// src/application/use-cases/review-submission/ReviewSubmissionUseCase.ts
// ============================================================

import type { ISubmissionRepository } from "@/core/repositories/ISubmissionRepository";
import type { ReviewSubmissionInput } from "./ReviewSubmissionUseCase.input.dto";
import type { ReviewSubmissionOutput } from "./ReviewSubmissionUseCase.output.dto";

export class ReviewSubmissionUseCase {
  constructor(private readonly submissionRepository: ISubmissionRepository) {}

  async execute(input: ReviewSubmissionInput): Promise<ReviewSubmissionOutput> {
    // ── Paso 1: validar rango de score ──────────────────────────
    if (
      !Number.isInteger(input.score) ||
      input.score < 1 ||
      input.score > 100
    ) {
      return { success: false, reason: "invalid_score" };
    }

    // ── Paso 2: idempotencia — no corregir dos veces la misma entrega ──
    const existing = await this.submissionRepository.findFeedbackBySubmissionId(
      input.submissionId,
    );
    if (existing) {
      return { success: false, reason: "already_reviewed" };
    }

    // ── Paso 3: calcular aprobación ─────────────────────────────
    // Se deriva automáticamente, no es una elección libre de Hebe.
    const isApproved = input.score >= input.approvalMinScore;

    // ── Paso 4: crear el feedback ────────────────────────────────
    // El trigger fn_update_submission_status_on_feedback actualiza
    // automáticamente el status de la submission en la DB.
    const feedback = await this.submissionRepository.createFeedback({
      submissionId: input.submissionId,
      reviewerId: input.reviewerId,
      feedbackText: input.feedbackText,
      score: input.score,
      isApproved,
    });

    return { success: true, feedback };
  }
}
