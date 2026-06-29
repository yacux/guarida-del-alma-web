// ============================================================
// src/core/entities/Module.ts
//
// Un Curso está compuesto por:
//
// Curso
//   └── Módulos
//          ├── Recursos
//          └── 1 Tarea
//
// Los recursos pueden ser:
//
// • Videos
// • PDFs
// • Audios
// • Descargables
// • Links externos
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

export type ModuleResourceType =
  | "video"
  | "pdf"
  | "audio"
  | "download"
  | "external_link";

export interface ModuleResource {
  id: UUID;

  /** Módulo al que pertenece */
  moduleId: UUID;

  title: string;

  resourceType: ModuleResourceType;

  /**
   * Puede apuntar a:
   *
   * • Youtube
   * • Vimeo
   * • Supabase Storage
   * • Amazon S3
   * • Google Drive
   * • etc.
   */
  url: string;

  /**
   * Solo tiene sentido para videos y audios.
   */
  durationSeconds: number | null;

  /**
   * Permite ordenar los recursos
   * dentro del módulo.
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
// Cada módulo posee exactamente UNA tarea.
// La entrega y corrección viven en Submission.ts.
// ============================================================

export interface ModuleAssignment {
  id: UUID;

  moduleId: UUID;

  title: string;

  instructions: string | null;

  /**
   * Lista de preguntas.
   */
  questions: string[];

  createdAt: ISODateString;
}

export type CreateModuleAssignmentInput = Omit<
  ModuleAssignment,
  "id" | "createdAt"
>;

// ============================================================
// ACTIVIDAD FINAL
//
// Existe una única actividad final por curso.
//
// Sus entregas y devoluciones viven
// en Submission.ts.
// ============================================================

export interface FinalActivity {
  id: UUID;

  productId: UUID;

  title: string;

  instructions: string | null;

  questions: string[];

  createdAt: ISODateString;
}

export type CreateFinalActivityInput = Omit<FinalActivity, "id" | "createdAt">;
