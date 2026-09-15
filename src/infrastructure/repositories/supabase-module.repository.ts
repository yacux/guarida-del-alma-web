// ============================================================
// src/infrastructure/repositories/supabase-module.repository.ts
//
// Implementación concreta de IModuleRepository para Supabase.
// Mapea snake_case de la DB → camelCase del dominio.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IModuleRepository } from "@/core/repositories/IModuleRepository";
import type {
  CourseModule,
  ModuleResource,
  ModuleAssignment,
} from "@/core/entities/Module";
import type { ModuleProgress } from "@/core/entities/StudentProgress";
import type { UUID, ClerkUserId } from "@/core/entities/shared";

// ── Tipos de fila crudos ─────────────────────────────────────

interface ModuleRow {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

interface ResourceRow {
  id: string;
  module_id: string;
  title: string;
  resource_type: string;
  url: string;
  storage_path: string | null;
  duration_seconds: number | null;
  order_index: number;
  created_at: string;
}

interface AssignmentRow {
  id: string;
  module_id: string;
  title: string;
  created_at: string;
}

interface ProgressRow {
  id: string;
  student_id: string;
  enrollment_id: string;
  module_id: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
  completed_at: string | null;
}

// ── Implementación ───────────────────────────────────────────

export class SupabaseModuleRepository implements IModuleRepository {
  constructor(private readonly client: SupabaseClient) {}

  // ── Contenido ──────────────────────────────────────────────

  async findByCourseId(courseProductId: UUID): Promise<CourseModule[]> {
    const { data, error } = await this.client
      .from("modules")
      .select("*")
      .eq("product_id", courseProductId)
      .order("order_index", { ascending: true });

    if (error)
      throw new Error(`[ModuleRepository.findByCourseId] ${error.message}`);

    return (data ?? []).map((r: ModuleRow) => this.moduleRowToDomain(r));
  }

  async findByOrderInCourse(
    courseProductId: UUID,
    orderIndex: number,
  ): Promise<CourseModule | null> {
    const { data, error } = await this.client
      .from("modules")
      .select("*")
      .eq("product_id", courseProductId)
      .eq("order_index", orderIndex)
      .maybeSingle();

    if (error)
      throw new Error(
        `[ModuleRepository.findByOrderInCourse] ${error.message}`,
      );

    return data ? this.moduleRowToDomain(data as ModuleRow) : null;
  }

  async findResourcesByModuleId(moduleId: UUID): Promise<ModuleResource[]> {
    const { data, error } = await this.client
      .from("module_learning_resources")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });

    if (error)
      throw new Error(
        `[ModuleRepository.findResourcesByModuleId] ${error.message}`,
      );

    return (data ?? []).map((r: ResourceRow) => this.resourceRowToDomain(r));
  }

  async findAssignmentByModuleId(
    moduleId: UUID,
  ): Promise<ModuleAssignment | null> {
    const { data, error } = await this.client
      .from("module_assignments")
      .select("*")
      .eq("module_id", moduleId)
      .maybeSingle();

    if (error)
      throw new Error(
        `[ModuleRepository.findAssignmentByModuleId] ${error.message}`,
      );

    return data ? this.assignmentRowToDomain(data as AssignmentRow) : null;
  }

  // ── Progreso del alumno ─────────────────────────────────────
  async findProgressByStudentAndCourse(
    studentId: ClerkUserId,
    courseProductId: UUID,
  ): Promise<ModuleProgress[]> {
    //
    // JOIN con modules para filtrar por product_id del curso.
    // No filtramos por enrollment_id → funciona igual para
    // sino q funciona matrícula directa y acceso vía programa.
    //
    const { data, error } = await this.client
      .from("student_module_progress")
      .select(
        `
        *,
        modules!inner ( product_id )
      `,
      )
      .eq("student_id", studentId)
      .eq("modules.product_id", courseProductId);

    if (error)
      throw new Error(
        `[ModuleRepository.findProgressByStudentAndCourse] ${error.message}`,
      );

    return (data ?? []).map((r: ProgressRow) => this.progressRowToDomain(r));
  }

  // ── Progreso de un módulo específico para un alumno ─────────────
  async findProgressByStudentAndModule(
    studentId: ClerkUserId,
    moduleId: UUID,
  ): Promise<ModuleProgress | null> {
    const { data, error } = await this.client
      .from("student_module_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (error)
      throw new Error(
        `[ModuleRepository.findProgressByStudentAndModule] ${error.message}`,
      );

    return data ? this.progressRowToDomain(data as ProgressRow) : null;
  }

  // ── Mappers ────────────────────────────────────────────────

  private moduleRowToDomain(r: ModuleRow): CourseModule {
    return {
      id: r.id,
      productId: r.product_id,
      title: r.title,
      description: r.description,
      orderIndex: r.order_index,
      createdAt: r.created_at,
    };
  }

  private resourceRowToDomain(r: ResourceRow): ModuleResource {
    return {
      id: r.id,
      moduleId: r.module_id,
      title: r.title,
      // El CHECK constraint de la DB garantiza que es un ResourceType válido
      resourceType: r.resource_type as ModuleResource["resourceType"],
      url: r.url,
      storagePath: r.storage_path,
      durationSeconds: r.duration_seconds,
      orderIndex: r.order_index,
      createdAt: r.created_at,
    };
  }

  private assignmentRowToDomain(r: AssignmentRow): ModuleAssignment {
    return {
      id: r.id,
      moduleId: r.module_id,
      title: r.title,
      createdAt: r.created_at,
    };
  }

  private progressRowToDomain(r: ProgressRow): ModuleProgress {
    return {
      id: r.id,
      studentId: r.student_id,
      enrollmentId: r.enrollment_id,
      moduleId: r.module_id,
      isUnlocked: r.is_unlocked,
      unlockedAt: r.unlocked_at,
      completedAt: r.completed_at,
    };
  }
}
