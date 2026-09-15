// ============================================================
// src/application/use-cases/submit-assignment/SubmitAssignmentUseCase.ts
// ============================================================

import type { IModuleRepository } from "@/core/repositories/IModuleRepository";
import type { ISubmissionRepository } from "@/core/repositories/ISubmissionRepository";
import type { SubmitAssignmentInput } from "./SubmitAssignmentUseCase.input.dto";
import type { SubmitAssignmentOutput } from "./SubmitAssignmentUseCase.output.dto";
import { canResubmit } from "@/core/auth/policies/submission.policy";

export class SubmitAssignmentUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly submissionRepository: ISubmissionRepository,
  ) {}

  async execute(input: SubmitAssignmentInput): Promise<SubmitAssignmentOutput> {
    // ── Paso 1: validar respuesta no vacía ─────────────────────
    // Sin questions[] estructuradas, la única validación de forma
    // es que exista al menos una respuesta con contenido real.
    const hasContent = input.answers.some((a) => a.trim().length > 0);
    if (!hasContent) {
      return { success: false, reason: "empty_answer" };
    }

    // ── Paso 2: verificar que el módulo está desbloqueado ──────
    const progress = await this.moduleRepository.findProgressByStudentAndModule(
      input.studentId,
      input.moduleId,
    );

    if (!progress || !progress.isUnlocked) {
      return { success: false, reason: "module_locked" };
    }

    // ── Paso 3: obtener el último intento (si existe) ──────────
    const latest =
      await this.submissionRepository.findLatestByAssignmentAndStudent(
        input.assignmentId,
        input.studentId,
      );

    // ── Paso 4: validar que puede entregar/re-entregar ─────────
    // Regla: primera entrega siempre permitida (latest === null).
    // Re-entrega solo si la última fue rechazada (canResubmit).
    if (latest !== null && !canResubmit(latest)) {
      return { success: false, reason: "cannot_resubmit" };
    }

    // ── Paso 5: calcular attempt_number ─────────────────────────
    const attemptNumber = latest ? latest.attemptNumber + 1 : 1;

    // ── Paso 6: crear la entrega ─────────────────────────────────
    // El trigger fn_unlock_next_module_on_submit se dispara en la DB
    // automáticamente cuando attempt_number = 1.
    const submission = await this.submissionRepository.createSubmission({
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      enrollmentId: input.enrollmentId,
      attemptNumber,
      answers: input.answers,
    });

    return { success: true, submission };
  }
}
