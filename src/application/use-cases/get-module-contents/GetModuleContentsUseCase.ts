// ============================================================
// src/application/use-cases/get-module-page/GetModuleContentsUseCase.ts
// ============================================================

import type { IProductDetailsRepository } from "@/core/repositories/IProductDetailsRepository";
import type { IModuleRepository } from "@/core/repositories/IModuleRepository";
import type { ISubmissionRepository } from "@/core/repositories/ISubmissionRepository";
import type { ModuleSubmission } from "@/core/entities/Submission";
import type { ModuleSubmissionFeedback } from "@/core/entities/Submission";
import type { ModuleProgress } from "@/core/entities/StudentProgress";
import type { GetModuleContentsInput } from "./GetModuleContentsUseCase.input.dto";
import type {
  GetModuleContentsOutput,
  ModuleNav,
} from "./GetModuleContentsUseCase.output.dto";
import { isCourse } from "@/core/entities/Product";
import { canResubmit } from "@/core/auth/policies/submission.policy";

export class GetModuleContentsUseCase {
  constructor(
    private readonly productDetailsRepository: IProductDetailsRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly submissionRepository: ISubmissionRepository,
  ) {}

  async execute(
    input: GetModuleContentsInput,
  ): Promise<GetModuleContentsOutput | null> {
    // ── Paso 1: resolver el curso por slug ─────────────────────
    const variant = await this.productDetailsRepository.findBySlug(
      input.courseSlug,
    );

    if (!variant) return null;
    if (!isCourse(variant)) return null;

    // ── Paso 2: módulo solicitado + todos los módulos en paralelo
    const [module, allModules] = await Promise.all([
      this.moduleRepository.findByOrderInCourse(variant.id, input.moduleOrder),
      this.moduleRepository.findByCourseId(variant.id),
    ]);

    console.log({
      courseId: variant.id,
      requestedOrder: input.moduleOrder,
      module,
      totalModules: allModules.length,
    });
    if (!module) return null;

    // ── Paso 3: recursos, tarea y progreso en paralelo ─────────
    const [resources, assignment, progress] = await Promise.all([
      this.moduleRepository.findResourcesByModuleId(module.id),
      this.moduleRepository.findAssignmentByModuleId(module.id),
      this.moduleRepository.findProgressByStudentAndModule(
        input.studentId,
        module.id,
      ),
    ]);

    // ── Paso 4: última entrega (solo si hay tarea) ─────────────
    let latestSubmission: ModuleSubmission | null = null;
    let feedback: ModuleSubmissionFeedback | null = null;

    if (assignment) {
      latestSubmission =
        await this.submissionRepository.findLatestByAssignmentAndStudent(
          assignment.id,
          input.studentId,
        );

      if (latestSubmission) {
        feedback = await this.submissionRepository.findFeedbackBySubmissionId(
          latestSubmission.id,
        );
      }
    }

    // ── Paso 5: canSubmit ──────────────────────────────────────
    // Puede entregar si:
    //   • existe tarea
    //   • el módulo está desbloqueado (progress existe y isUnlocked = true)
    //   • nunca entregó (latestSubmission === null)
    //     O su última entrega fue rechazada (canResubmit)
    const canSubmit =
      assignment !== null &&
      progress !== null &&
      progress.isUnlocked &&
      (latestSubmission === null || canResubmit(latestSubmission));

    // ── Paso 6: navegación ─────────────────────────────────────
    const nav = this.buildNav(input.moduleOrder, allModules.length);

    return {
      course: variant,
      module,
      resources,
      assignment,
      latestSubmission,
      feedback,
      progress,
      canSubmit,
      enrollmentId: progress?.enrollmentId ?? null,
      nav,
    };
  }

  private buildNav(currentOrder: number, totalModules: number): ModuleNav {
    return {
      previousOrder: currentOrder > 0 ? currentOrder - 1 : null,
      nextOrder: currentOrder < totalModules - 1 ? currentOrder + 1 : null,
      totalModules,
    };
  }
}
