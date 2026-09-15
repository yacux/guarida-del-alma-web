// ============================================================
// src/application/use-cases/review-submission/ReviewSubmissionUseCase.output.dto.ts
// ============================================================

import type { ModuleSubmissionFeedback } from "@/core/entities/Submission";

export type ReviewSubmissionOutput =
  | { success: true; feedback: ModuleSubmissionFeedback }
  | { success: false; reason: ReviewSubmissionErrorReason };

export type ReviewSubmissionErrorReason = "invalid_score" | "already_reviewed";
