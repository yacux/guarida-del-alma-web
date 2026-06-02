// ============================================================
// src/core/entities/Submission.ts
// Entregas de tareas de módulo y de la actividad final,
// con su sistema de corrección (nota, aprobación, devolución)
// y soporte para entregas de recuperación (attempt_number >= 2).
// ============================================================

import type { UUID, ClerkUserId, ISODateString, SubmissionStatus } from './shared';

// ——————————————————————————————————————————————
// ENTREGA DE TAREA DE MÓDULO — public.assignment_submissions
// ——————————————————————————————————————————————
export interface ModuleSubmission {
  id: UUID;
  assignmentId: UUID;
  /** Clerk User ID de la alumna */
  studentId: ClerkUserId;
  enrollmentId: UUID;

  /**
   * Número de intento: 1 = entrega original, 2+ = recuperación.
   * Una alumna puede re-entregar si su entrega anterior fue 'failed'.
   */
  attemptNumber: number;

  /**
   * Respuestas de la alumna, en array paralelo a ModuleAssignment.questions.
   * Ej: ["Mi respuesta a la pregunta 1", "Mi respuesta a la pregunta 2"]
   */
  answers: string[];

  submittedAt: ISODateString;
  status: SubmissionStatus;
}

export type CreateModuleSubmissionInput = Omit<
  ModuleSubmission,
  'id' | 'submittedAt' | 'status'
>;

// ——————————————————————————————————————————————
// CORRECCIÓN DE TAREA — public.assignment_feedback
// Escrita por Hebe (admin). 1 corrección por entrega.
// ——————————————————————————————————————————————
export interface ModuleSubmissionFeedback {
  id: UUID;
  submissionId: UUID;
  /** Hebe siempre es el reviewer (admin) */
  /** Clerk User ID de Hebe (admin) */
  reviewerId: ClerkUserId;
  /** Devolución en texto: comentarios, observaciones, sugerencias */
  feedbackText: string | null;
  /** Nota de 1 a 100 */
  score: number;
  /** true si score >= approvalMinScore del curso */
  isApproved: boolean;
  reviewedAt: ISODateString;
}

export type CreateModuleSubmissionFeedbackInput = Omit<
  ModuleSubmissionFeedback,
  'id' | 'reviewedAt'
>;

// ——————————————————————————————————————————————
// ENTREGA DE ACTIVIDAD FINAL — public.final_activity_submissions
// Mismo patrón que ModuleSubmission, pero para el examen final del curso.
// ——————————————————————————————————————————————
export interface FinalActivitySubmission {
  id: UUID;
  finalActivityId: UUID;
  /** Clerk User ID de la alumna */
  studentId: ClerkUserId;
  enrollmentId: UUID;
  attemptNumber: number;
  answers: string[];
  submittedAt: ISODateString;
  status: SubmissionStatus;
}

export type CreateFinalActivitySubmissionInput = Omit<
  FinalActivitySubmission,
  'id' | 'submittedAt' | 'status'
>;

// ——————————————————————————————————————————————
// CORRECCIÓN DE ACTIVIDAD FINAL — public.final_activity_feedback
// ——————————————————————————————————————————————
export interface FinalActivityFeedback {
  id: UUID;
  submissionId: UUID;
  /** Clerk User ID de Hebe (admin) */
  reviewerId: ClerkUserId;
  feedbackText: string | null;
  score: number;
  isApproved: boolean;
  reviewedAt: ISODateString;
}

export type CreateFinalActivityFeedbackInput = Omit<
  FinalActivityFeedback,
  'id' | 'reviewedAt'
>;

// ——————————————————————————————————————————————
// HELPERS DE DOMINIO (puras, sin I/O)
// ——————————————————————————————————————————————

/** ¿Puede la alumna re-entregar esta tarea? */
export const canResubmit = (
  latest: ModuleSubmission | FinalActivitySubmission
): boolean => latest.status === 'failed';

/** ¿Está pendiente de revisión por Hebe? */
export const isPendingReview = (
  s: ModuleSubmission | FinalActivitySubmission
): boolean =>
  s.status === 'pending_review' || s.status === 'recovery_pending';