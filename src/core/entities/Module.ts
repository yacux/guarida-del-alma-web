// ============================================================
// src/core/entities/Module.ts
//
// Un Curso está compuesto por:
//
// Curso
//   └── Módulos
//          ├── Recursos
//          └── 1 Tarea (opcional — no todos los módulos la tienen)
//
// Los recursos pueden ser:
//
// • Videos
// • PDFs
// • Audios
//
// Además, el curso posee una única Actividad Final.
// ============================================================

import type { UUID, ISODateString } from "./shared";

// ============================================================
// MÓDULO
// ============================================================

export interface CourseModule {
  id: UUID;

  /** Curso al que pertenece */
  productId: UUID;

  title: string;

  description: string | null;

  /** Orden dentro del curso */
  orderIndex: number;

  createdAt: ISODateString;
}

export type CreateModuleInput = Omit<CourseModule, "id" | "createdAt">;

// ============================================================
// RECURSO DEL MÓDULO
// ============================================================

export type ModuleResourceType = "video" | "pdf" | "audio";

export interface ModuleResource {
  id: UUID;

  /** Módulo al que pertenece */
  moduleId: UUID;

  title: string;

  resourceType: ModuleResourceType;

  /**
   * Solo poblado cuando resourceType = 'video'.
   * URL externa directa (YouTube, Vimeo, etc.).
   */
  url: string | null;

  /**
   * Solo poblado cuando resourceType = 'pdf' | 'audio'.
   * Path del objeto en el bucket privado learning-resources.
   * Ej: "courses/amor-propio/modules/1/guia.pdf"
   *
   * La presentación nunca consume este path directamente:
   * el use case lo resuelve a una Signed URL temporal.
   */
  storagePath: string | null;

  /**
   * Solo tiene sentido para videos y audios.
   */
  durationSeconds: number | null;

  /**
   * Permite ordenar los recursos dentro del módulo.
   */
  orderIndex: number;

  createdAt: ISODateString;
}

export type CreateModuleResourceInput = Omit<
  ModuleResource,
  "id" | "createdAt"
>;

// ============================================================
// TAREA DEL MÓDULO
//
// Representa que un módulo tiene una tarea evaluable.
// No todos los módulos tienen tarea (por eso es | null en los DTOs
// que la consumen).
//
// La consigna vive en el PDF del módulo — no se duplica acá.
// Las entregas y devoluciones viven en Submission.ts.
// ============================================================

export interface ModuleAssignment {
  id: UUID;

  moduleId: UUID;

  title: string;

  createdAt: ISODateString;
}

export type CreateModuleAssignmentInput = Omit<
  ModuleAssignment,
  "id" | "createdAt"
>;

// ============================================================
// ACTIVIDAD FINAL
//
// Existe como máximo una actividad final por curso.
// La consigna vive en un PDF del curso — no se duplica acá.
//
// Sus entregas y devoluciones viven en Submission.ts.
// ============================================================

export interface FinalActivity {
  id: UUID;

  productId: UUID;

  title: string;

  createdAt: ISODateString;
}

export type CreateFinalActivityInput = Omit<FinalActivity, "id" | "createdAt">;
// ============================================================
// REGLAS DE NEGOCIO DE RECURSOS — función pura, sin I/O
// ============================================================
//
// Reglas (actualizado tras la migración que permite múltiples PDFs):
//   pdf   → obligatorio, MÍNIMO 1 (antes: exactamente 1)
//           Permite separar guía de contenido y consigna de tarea
//           en archivos distintos cuando Hebe lo necesita.
//   video → obligatorio, mínimo 1
//   audio → opcional, 0..N

// Esta función no hace queries ni conoce Supabase. Se puede
// testear con un array en memoria. Útil, por ejemplo, para dar
// feedback inmediato desde el panel de Hebe al guardar recursos,
// sin depender del mensaje crudo de un CHECK constraint de Postgres.

export function validateModuleResources(
  resources: Pick<ModuleResource, "resourceType">[],
): string[] {
  const errors: string[] = [];

  const pdfCount = resources.filter((r) => r.resourceType === "pdf").length;
  const videoCount = resources.filter((r) => r.resourceType === "video").length;

  if (pdfCount === 0) {
    errors.push("El módulo debe tener al menos 1 PDF.");
  }

  if (videoCount === 0) {
    errors.push("El módulo debe tener al menos 1 video.");
  }

  return errors;
}

export function hasValidModuleResources(
  resources: Pick<ModuleResource, "resourceType">[],
): boolean {
  return validateModuleResources(resources).length === 0;
}

// ── Recurso de taller ────────────────────────────────────────
// Estructuralmente igual a ModuleResource, pero sin módulos:
// el recurso pertenece directamente al producto (taller).

export interface WorkshopResource {
  id: UUID;
  productId: UUID;
  title: string;
  resourceType: ModuleResourceType;
  url: string | null;
  storagePath: string | null;
  durationSeconds: number | null;
  orderIndex: number;
  createdAt: ISODateString;
}
