// ============================================================
// src/application/use-cases/get-submission-history/GetSubmissionHistoryUseCase.ts
// ============================================================

import type { ISubmissionRepository } from "@/core/repositories/ISubmissionRepository";
import type { ModuleSubmission, ModuleSubmissionFeedback } from "@/core/entities/Submission";
import type { UUID, ClerkUserId } from "@/core/entities/shared";

export interface SubmissionHistoryEntry {
  submission: ModuleSubmission;
  /** null = todavía no corregida (es el intento actual pendiente). */
  feedback: ModuleSubmissionFeedback | null;
}

export class GetSubmissionHistoryUseCase {
  constructor(private readonly submissionRepository: ISubmissionRepository) {}

  /**
   * Devuelve TODOS los intentos de una alumna para una tarea,
   * ordenados por attempt_number ASC, cada uno con su feedback
   * (o null si aún no fue corregido — el caso del intento actual).
   */
  async execute(
    assignmentId: UUID,
    studentId: ClerkUserId,
  ): Promise<SubmissionHistoryEntry[]> {
    const submissions = await this.submissionRepository.findAllByAssignmentAndStudent(
      assignmentId,
      studentId,
    );

    return Promise.all(
      submissions.map(async (submission) => ({
        submission,
        feedback: await this.submissionRepository.findFeedbackBySubmissionId(submission.id),
      })),
    );
  }
}