// ============================================================
// src/app/(admin)/correcciones/_actions/review-submission.action.ts
// ============================================================

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseSubmissionRepository } from "@/infrastructure/repositories/supabase-submission.repository";
import { ReviewSubmissionUseCase } from "@/application/use-cases/review-submission/ReviewSubmissionUseCase";
import type { ReviewSubmissionOutput } from "@/application/use-cases/review-submission/ReviewSubmissionUseCase.output.dto";
import type { UUID } from "@/core/entities/shared";

interface Params {
  submissionId: UUID;
  feedbackText: string;
  score: number;
  approvalMinScore: number;
}

export async function reviewSubmissionAction(
  params: Params,
): Promise<ReviewSubmissionOutput> {
  const { userId } = await auth();
  if (!userId) return { success: false, reason: "invalid_score" };

  const client = await createSupabaseServerClient();

  const result = await new ReviewSubmissionUseCase(
    new SupabaseSubmissionRepository(client),
  ).execute({
    submissionId: params.submissionId,
    reviewerId: userId,
    feedbackText: params.feedbackText || null,
    score: params.score,
    approvalMinScore: params.approvalMinScore,
  });

  if (result.success) {
    revalidatePath("/admin/correcciones");
  }

  return result;
}
