// ============================================================
// src/core/repositories/ISubmissionRepository.ts
// ============================================================

import type {
  ModuleSubmission,
  ModuleSubmissionFeedback,
  CreateModuleSubmissionInput,
  CreateModuleSubmissionFeedbackInput,
} from "../entities/Submission";
import type { UUID } from "../entities/shared";
import type { ClerkUserId } from "../entities/shared";
import type { SubmissionStatus } from "../entities/shared";
import type { ISODateString } from "../entities/shared";

/**
 * Read-model compuesto para la cola de corrección de Hebe.
 *
 * NO es una entidad de dominio — es una proyección de consulta
 * que combina Submission + Assignment + Module + Course + Profile
 * en una sola forma, para evitar N+1 queries en la UI de admin.
 *
 * Vive acá (junto al repositorio) y no en core/entities porque
 * describe exactamente lo que este método promete devolver,
 * no un concepto de negocio persistible.
 */
export interface SubmissionReviewItem {
  submissionId: UUID;
  assignmentId: UUID;
  assignmentTitle: string;
  moduleId: UUID;
  moduleTitle: string;
  courseId: UUID;
  courseName: string;
  /** Nota mínima (1-100) para que la entrega se considere aprobada. */
  approvalMinScore: number;
  studentId: ClerkUserId;
  studentEmail: string;
  studentUsername: string;
  attemptNumber: number;
  answers: string[];
  submittedAt: ISODateString;
  status: SubmissionStatus;
}

export interface ISubmissionRepository {
  findLatestByAssignmentAndStudent(
    assignmentId: UUID,
    studentId: ClerkUserId,
  ): Promise<ModuleSubmission | null>;

  findAllByAssignmentAndStudent(
    assignmentId: UUID,
    studentId: ClerkUserId,
  ): Promise<ModuleSubmission[]>;

  findFeedbackBySubmissionId(
    submissionId: UUID,
  ): Promise<ModuleSubmissionFeedback | null>;

  createSubmission(
    input: CreateModuleSubmissionInput,
  ): Promise<ModuleSubmission>;

  /**
   * Todas las entregas pendientes de corrección en toda la plataforma
   * (status = 'pending_review' | 'recovery_pending'), con el contexto
   * necesario para que Hebe las revise sin navegar entrega por entrega.
   *
   * Ordenadas por submitted_at ASC (las más antiguas primero — cola justa).
   *
   * Requiere que el cliente que llama esté autenticado como admin:
   * la policy RLS de assignment_submissions ya permite ver todas las
   * filas cuando fn_my_role() = 'admin', sin necesidad de service role.
   */
  findAllPendingReview(): Promise<SubmissionReviewItem[]>;

  /**
   * Crea la corrección de Hebe sobre una entrega.
   * El trigger fn_update_submission_status_on_feedback actualiza
   * automáticamente el status de la submission en la DB.
   */
  createFeedback(
    input: CreateModuleSubmissionFeedbackInput,
  ): Promise<ModuleSubmissionFeedback>;
}
