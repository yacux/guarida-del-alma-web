// ============================================================
// src/application/use-cases/get-pending-submissions/GetPendingSubmissionsUseCase.output.dto.ts
// ============================================================

import type { SubmissionReviewItem } from "@/core/repositories/ISubmissionRepository";

export interface GetPendingSubmissionsOutput {
  items: SubmissionReviewItem[];
}
