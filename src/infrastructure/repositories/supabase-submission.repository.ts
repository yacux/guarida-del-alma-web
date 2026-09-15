// ============================================================
// src/infrastructure/repositories/supabase-submission.repository.ts
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ISubmissionRepository,
  SubmissionReviewItem,
} from "@/core/repositories/ISubmissionRepository";
import type {
  ModuleSubmission,
  ModuleSubmissionFeedback,
  CreateModuleSubmissionInput,
  CreateModuleSubmissionFeedbackInput,
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
    const { data, error } = await this.client
      .from("assignment_submissions")
      .insert({
        assignment_id: input.assignmentId,
        student_id: input.studentId,
        enrollment_id: input.enrollmentId,
        attempt_number: input.attemptNumber,
        answers: input.answers,
      })
      .select()
      .single();

    if (error)
      throw new Error(
        `[SubmissionRepository.createSubmission] ${error.message}`,
      );

    return this.submissionRowToDomain(data as SubmissionRow);
  }

  // ── Cola de corrección (admin) ──────────────────────────────

  async findAllPendingReview(): Promise<SubmissionReviewItem[]> {
    //
    // Estrategia: query base + batch fetches por IDs distintos,
    // en vez de un embedding anidado de PostgREST. Es más código
    // pero no depende de que PostgREST infiera correctamente las
    // relaciones FK anidadas (module_assignments → modules →
    // products → product_courses), que puede ser frágil si hay
    // ambigüedad de nombres de constraint.
    //

    // 1. Submissions pendientes, las más antiguas primero
    const { data: submissionRows, error: subError } = await this.client
      .from("assignment_submissions")
      .select("*")
      .in("status", ["pending_review", "recovery_pending"])
      .order("submitted_at", { ascending: true });

    if (subError)
      throw new Error(
        `[SubmissionRepository.findAllPendingReview] ${subError.message}`,
      );

    const submissions = (submissionRows ?? []) as SubmissionRow[];
    if (submissions.length === 0) return [];

    // 2. IDs distintos para las consultas batch
    const assignmentIds = [...new Set(submissions.map((s) => s.assignment_id))];
    const studentIds = [...new Set(submissions.map((s) => s.student_id))];

    // 3. Assignments → título + module_id
    const { data: assignmentRows, error: aError } = await this.client
      .from("module_assignments")
      .select("id, title, module_id")
      .in("id", assignmentIds);

    if (aError)
      throw new Error(
        `[SubmissionRepository.findAllPendingReview] assignments: ${aError.message}`,
      );

    const moduleIds = [
      ...new Set((assignmentRows ?? []).map((a) => a.module_id)),
    ];

    // 4. Modules → título + product_id
    const { data: moduleRows, error: mError } = await this.client
      .from("modules")
      .select("id, title, product_id")
      .in("id", moduleIds);

    if (mError)
      throw new Error(
        `[SubmissionRepository.findAllPendingReview] modules: ${mError.message}`,
      );

    const productIds = [
      ...new Set((moduleRows ?? []).map((m) => m.product_id)),
    ];

    // 5. Products (nombre) + product_courses (approval_min_score) en paralelo
    const [
      { data: productRows, error: pError },
      { data: courseRows, error: cError },
    ] = await Promise.all([
      this.client.from("products").select("id, name").in("id", productIds),
      this.client
        .from("product_courses")
        .select("product_id, approval_min_score")
        .in("product_id", productIds),
    ]);

    if (pError)
      throw new Error(
        `[SubmissionRepository.findAllPendingReview] products: ${pError.message}`,
      );
    if (cError)
      throw new Error(
        `[SubmissionRepository.findAllPendingReview] product_courses: ${cError.message}`,
      );

    // 6. Profiles (email + username)
    const { data: profileRows, error: profError } = await this.client
      .from("profiles")
      .select("id, email, username")
      .in("id", studentIds);

    if (profError)
      throw new Error(
        `[SubmissionRepository.findAllPendingReview] profiles: ${profError.message}`,
      );

    // ── Armar mapas de lookup O(1) ──────────────────────────────
    const assignmentById = new Map(
      (assignmentRows ?? []).map((a) => [a.id, a]),
    );
    const moduleById = new Map((moduleRows ?? []).map((m) => [m.id, m]));
    const productById = new Map((productRows ?? []).map((p) => [p.id, p]));
    const courseById = new Map(
      (courseRows ?? []).map((c) => [c.product_id, c]),
    );
    const profileById = new Map((profileRows ?? []).map((p) => [p.id, p]));

    // ── Combinar ─────────────────────────────────────────────
    const items: SubmissionReviewItem[] = [];

    for (const s of submissions) {
      const assignment = assignmentById.get(s.assignment_id);
      if (!assignment) continue; // integridad rota, saltar defensivamente

      const module = moduleById.get(assignment.module_id);
      if (!module) continue;

      const product = productById.get(module.product_id);
      const course = courseById.get(module.product_id);
      const profile = profileById.get(s.student_id);

      items.push({
        submissionId: s.id,
        assignmentId: s.assignment_id,
        assignmentTitle: assignment.title,
        moduleId: module.id,
        moduleTitle: module.title,
        courseId: module.product_id,
        courseName: product?.name ?? "Curso desconocido",
        approvalMinScore: course?.approval_min_score ?? 60,
        studentId: s.student_id,
        studentEmail: profile?.email ?? "",
        studentUsername: profile?.username ?? "Alumna",
        attemptNumber: s.attempt_number,
        answers: s.answers,
        submittedAt: s.submitted_at,
        status: s.status as SubmissionStatus,
      });
    }

    return items;
  }

  async createFeedback(
    input: CreateModuleSubmissionFeedbackInput,
  ): Promise<ModuleSubmissionFeedback> {
    const { data, error } = await this.client
      .from("assignment_feedback")
      .insert({
        submission_id: input.submissionId,
        reviewer_id: input.reviewerId,
        feedback_text: input.feedbackText,
        score: input.score,
        is_approved: input.isApproved,
      })
      .select()
      .single();

    if (error)
      throw new Error(`[SubmissionRepository.createFeedback] ${error.message}`);

    return this.feedbackRowToDomain(data as FeedbackRow);
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
