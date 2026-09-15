// ============================================================
// src/application/use-cases/get-module-page/GetModuleContentsUseCase.ts
// ============================================================

import type { IProductDetailsRepository } from "@/core/repositories/IProductDetailsRepository";
import type { IModuleRepository } from "@/core/repositories/IModuleRepository";
import type { ISubmissionRepository } from "@/core/repositories/ISubmissionRepository";
import type { IModuleResourceStorage } from "@/core/repositories/IModuleResourceStorage";
import type { ModuleResource } from "@/core/entities/Module";
import type { ModuleSubmission } from "@/core/entities/Submission";
import type { ModuleSubmissionFeedback } from "@/core/entities/Submission";
import type { GetModuleContentsInput } from "./GetModuleContentsUseCase.input.dto";
import type {
  GetModuleContentsOutput,
  ModuleNav,
  ResolvedModuleResource,
} from "./GetModuleContentsUseCase.output.dto";
import { isCourse } from "@/core/entities/Product";
import { canResubmit } from "@/core/auth/policies/submission.policy";

export class GetModuleContentsUseCase {
  constructor(
    private readonly productDetailsRepository: IProductDetailsRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly submissionRepository: ISubmissionRepository,
    private readonly resourceStorage: IModuleResourceStorage,
  ) {}

  async execute(
    input: GetModuleContentsInput,
  ): Promise<GetModuleContentsOutput | null> {
    const variant = await this.productDetailsRepository.findBySlug(
      input.courseSlug,
    );

    if (!variant) return null;
    if (!isCourse(variant)) return null;

    const [module, allModules] = await Promise.all([
      this.moduleRepository.findByOrderInCourse(variant.id, input.moduleOrder),
      this.moduleRepository.findByCourseId(variant.id),
    ]);

    if (!module) return null;

    const [rawResources, assignment, progress] = await Promise.all([
      this.moduleRepository.findResourcesByModuleId(module.id),
      this.moduleRepository.findAssignmentByModuleId(module.id),
      this.moduleRepository.findProgressByStudentAndModule(
        input.studentId,
        module.id,
      ),
    ]);

    // ── Resolver Signed URLs para pdf/audio ─────────────────────
    // video ya trae una url externa válida → se deja tal cual.
    // pdf/audio traen storagePath → hay que pedirle a Storage
    // la Signed URL temporal. Sin este paso, url siempre es null.
    const resources = await this.resolveResourceUrls(rawResources);
    console.log("rawResources:", rawResources);
    console.log("resolved:", resources);

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

    const canSubmit =
      assignment !== null &&
      progress !== null &&
      progress.isUnlocked &&
      (latestSubmission === null || canResubmit(latestSubmission));

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

  private async resolveResourceUrls(
    rawResources: ModuleResource[],
  ): Promise<ResolvedModuleResource[]> {
    return Promise.all(
      rawResources.map(async (resource) => {
        const needsSignedUrl =
          resource.resourceType === "pdf" || resource.resourceType === "audio";

        const url =
          needsSignedUrl && resource.storagePath
            ? await this.resourceStorage.createSignedUrl(resource.storagePath)
            : resource.url;

        return {
          id: resource.id,
          moduleId: resource.moduleId,
          title: resource.title,
          resourceType: resource.resourceType,
          url,
          durationSeconds: resource.durationSeconds,
          orderIndex: resource.orderIndex,
        };
      }),
    );
  }

  private buildNav(currentOrder: number, totalModules: number): ModuleNav {
    return {
      previousOrder: currentOrder > 0 ? currentOrder - 1 : null,
      nextOrder: currentOrder < totalModules - 1 ? currentOrder + 1 : null,
      totalModules,
    };
  }
}
