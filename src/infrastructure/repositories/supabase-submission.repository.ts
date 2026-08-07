// ============================================================
// src/infrastructure/repositories/supabase-submission.repository.ts
//
// Implementación concreta de ISubmissionRepository para Supabase.
// Mapea snake_case → camelCase del dominio.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ISubmissionRepository } from "@/core/repositories/ISubmissionRepository";
import type {
  ModuleSubmission,
  ModuleSubmissionFeedback,
  CreateModuleSubmissionInput,
} from "@/core/entities/Submission";
import type { UUID, ClerkUserId } from "@/core/entities/shared";
import type { SubmissionStatus } from "@/core/entities/shared";

// ── Tipos de fila crudos ─────────────────────────────────────

interface SubmissionRow {
  id: string;
  assignment_id: string;
  student_id: string;
  enrollment_id: string;
  attempt_number: number;
  answers: string[];
  submitted_at: string;
  status: string;
}

interface FeedbackRow {
  id: string;
  submission_id: string;
  reviewer_id: string;
  feedback_text: string | null;
  score: number;
  is_approved: boolean;
  reviewed_at: string;
}

// ── Implementación ───────────────────────────────────────────

export class SupabaseSubmissionRepository implements ISubmissionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findLatestByAssignmentAndStudent(
    assignmentId: UUID,
    studentId: ClerkUserId,
  ): Promise<ModuleSubmission | null> {
    //
    // "Último" = attempt_number más alto.
    // Si el alumno nunca entregó, devuelve null.
    //
    const { data, error } = await this.client
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("student_id", studentId)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error)
      throw new Error(
        `[SubmissionRepository.findLatestByAssignmentAndStudent] ${error.message}`,
      );

    return data ? this.submissionRowToDomain(data as SubmissionRow) : null;
  }

  async findAllByAssignmentAndStudent(
    assignmentId: UUID,
    studentId: ClerkUserId,
  ): Promise<ModuleSubmission[]> {
    const { data, error } = await this.client
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("student_id", studentId)
      .order("attempt_number", { ascending: true });

    if (error)
      throw new Error(
        `[SubmissionRepository.findAllByAssignmentAndStudent] ${error.message}`,
      );

    return (data ?? []).map((r: SubmissionRow) =>
      this.submissionRowToDomain(r),
    );
  }

  async findFeedbackBySubmissionId(
    submissionId: UUID,
  ): Promise<ModuleSubmissionFeedback | null> {
    //
    // La tabla tiene UNIQUE (submission_id) → máximo 1 feedback por entrega.
    //
    const { data, error } = await this.client
      .from("assignment_feedback")
      .select("*")
      .eq("submission_id", submissionId)
      .maybeSingle();

    if (error)
      throw new Error(
        `[SubmissionRepository.findFeedbackBySubmissionId] ${error.message}`,
      );

    return data ? this.feedbackRowToDomain(data as FeedbackRow) : null;
  }

  async createSubmission(
    input: CreateModuleSubmissionInput,
  ): Promise<ModuleSubmission> {
    //
    // El trigger fn_unlock_next_module_on_submit se dispara
    // automáticamente en la DB cuando attempt_number = 1.
    // No hay lógica de desbloqueo aquí.
    //
    const { data, error } = await this.client
      .from("assignment_submissions")
      .insert({
        assignment_id: input.assignmentId,
        student_id: input.studentId,
        enrollment_id: input.enrollmentId,
        attempt_number: input.attemptNumber,
        answers: input.answers,
        // status DEFAULT 'pending_review' → no lo enviamos,
        // la DB lo asigna y el trigger de feedback lo actualiza.
      })
      .select()
      .single();

    if (error)
      throw new Error(
        `[SubmissionRepository.createSubmission] ${error.message}`,
      );

    return this.submissionRowToDomain(data as SubmissionRow);
  }

  // ── Mappers ────────────────────────────────────────────────

  private submissionRowToDomain(r: SubmissionRow): ModuleSubmission {
    return {
      id: r.id,
      assignmentId: r.assignment_id,
      studentId: r.student_id,
      enrollmentId: r.enrollment_id,
      attemptNumber: r.attempt_number,
      answers: r.answers,
      submittedAt: r.submitted_at,
      status: r.status as SubmissionStatus,
    };
  }

  private feedbackRowToDomain(r: FeedbackRow): ModuleSubmissionFeedback {
    return {
      id: r.id,
      submissionId: r.submission_id,
      reviewerId: r.reviewer_id,
      feedbackText: r.feedback_text,
      score: r.score,
      isApproved: r.is_approved,
      reviewedAt: r.reviewed_at,
    };
  }
}
