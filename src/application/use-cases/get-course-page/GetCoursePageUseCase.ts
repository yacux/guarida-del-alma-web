// ============================================================
// src/application/use-cases/course/GetCoursePageUseCase.ts
// ============================================================

import type { IProductDetailsRepository } from "@/core/repositories/IProductDetailsRepository";
import type { IModuleRepository } from "@/core/repositories/IModuleRepository";
import type { IAnnouncementRepository } from "@/core/repositories/IAnnouncementRepository";
import type { ModuleProgress } from "@/core/entities/StudentProgress";
import type { GetCoursePageInput } from "./GetCoursePageUseCase.input.dto";
import type {
  GetCoursePageOutput,
  CourseModuleWithStatus,
  ModuleStatus,
} from "./GetCoursePageUseCase.output.dto";
import { isCourse } from "@/core/entities/Product";

export class GetCoursePageUseCase {
  constructor(
    private readonly productDetailsRepository: IProductDetailsRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly announcementRepository: IAnnouncementRepository,
  ) {}

  async execute(
    input: GetCoursePageInput,
  ): Promise<GetCoursePageOutput | null> {
    // ── Paso 1: resolver el producto por slug ──────────────────
    const variant = await this.productDetailsRepository.findBySlug(
      input.courseSlug,
    );

    // null  = slug no encontrado → la page hace notFound()
    // throw = error real de infraestructura
    if (!variant) return null;
    if (!isCourse(variant)) return null;

    // ── Paso 2: queries en paralelo ────────────────────────────
    // Ya tenemos el courseId → disparamos las tres consultas juntas.
    const [modules, progressList, announcements] = await Promise.all([
      this.moduleRepository.findByCourseId(variant.id),
      this.moduleRepository.findProgressByStudentAndCourse(
        input.studentId,
        variant.id,
      ),
      this.announcementRepository.findByProductId(variant.id),
    ]);

    // ── Paso 3: combinar módulos con progreso ──────────────────
    const progressByModuleId = new Map(
      progressList.map((p) => [p.moduleId, p]),
    );

    const modulesWithStatus: CourseModuleWithStatus[] = modules.map((mod) => {
      const progress = progressByModuleId.get(mod.id) ?? null;
      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        status: this.deriveStatus(progress),
        unlockedAt: progress?.unlockedAt ?? null,
        completedAt: progress?.completedAt ?? null,
      };
    });

    return {
      course: variant,
      modules: modulesWithStatus,
      announcements,
    };
  }

  // ── Helpers privados ───────────────────────────────────────

  /**
   * Deriva el ModuleStatus a partir del progreso del alumno.
   *
   * null progress → locked   (sin fila en student_module_progress)
   * completedAt   → completed (entregó la tarea)
   * isUnlocked    → unlocked  (desbloqueado, sin entrega aún)
   * fallback      → locked
   */
  private deriveStatus(progress: ModuleProgress | null): ModuleStatus {
    if (!progress) return "locked";
    if (progress.completedAt) return "completed";
    if (progress.isUnlocked) return "unlocked";
    return "locked";
  }
}
