// ============================================================
// src/app/(dashboard)/aula-virtual/_actions/submit-assignment.action.ts
// ============================================================

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseModuleRepository } from "@/infrastructure/repositories/supabase-module.repository";
import { SupabaseSubmissionRepository } from "@/infrastructure/repositories/supabase-submission.repository";
import { SubmitAssignmentUseCase } from "@/application/use-cases/submit-assignment/SubmitAssignmentUseCase";
import type { SubmitAssignmentOutput } from "@/application/use-cases/submit-assignment/SubmitAssignmentUseCase.output.dto";
import type { UUID } from "@/core/entities/shared";

interface SubmitAssignmentActionParams {
  assignmentId: UUID;
  moduleId: UUID;
  enrollmentId: UUID;
  answer: string;
  courseSlug: string;
  moduleOrder: number;
}

export async function submitAssignmentAction(
  params: SubmitAssignmentActionParams,
): Promise<SubmitAssignmentOutput> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, reason: "module_locked" };
  }

  const client = await createSupabaseServerClient();

  const useCase = new SubmitAssignmentUseCase(
    new SupabaseModuleRepository(client),
    new SupabaseSubmissionRepository(client),
  );

  const result = await useCase.execute({
    assignmentId: params.assignmentId,
    moduleId: params.moduleId,
    studentId: userId,
    enrollmentId: params.enrollmentId,
    answers: [params.answer],
  });

  if (result.success) {
    // Actualiza la vista del módulo (nueva entrega + status)
    revalidatePath(
      `/aula-virtual/${params.courseSlug}/modulos/${params.moduleOrder}`,
    );
    // Si fue attempt_number=1, el trigger desbloqueó el siguiente
    // módulo → el overview del curso también necesita refrescarse.
    revalidatePath(`/aula-virtual/${params.courseSlug}`);
  }

  return result;
}
