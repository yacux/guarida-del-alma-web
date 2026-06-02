// ============================================================
// src/core/entities/Module.ts
// Estructura interna de un Curso: módulos, videos, tareas y
// actividad/examen final. Sin dependencias externas.
// ============================================================

import type { UUID, ISODateString } from "./shared";

// ——————————————————————————————————————————————
// MÓDULO — public.modules
// ——————————————————————————————————————————————
export interface CourseModule {
  id: UUID;
  /** ID del producto (curso) al que pertenece */
  productId: UUID;
  title: string;
  description: string | null;
  /** Posición en el curso, empezando en 0 */
  orderIndex: number;
  /** URL del PDF de contenido del módulo (1 por módulo) */
  contentPdfUrl: string | null;
  createdAt: ISODateString;
}

export type CreateModuleInput = Omit<CourseModule, "id" | "createdAt">;

// ——————————————————————————————————————————————
// VIDEO DE MÓDULO — public.module_videos
// Varios videos por módulo
// ——————————————————————————————————————————————
export interface ModuleVideo {
  id: UUID;
  moduleId: UUID;
  title: string;
  videoUrl: string;
  /** Duración en segundos (opcional, para mostrar en UI) */
  durationSeconds: number | null;
  orderIndex: number;
  createdAt: ISODateString;
}

export type CreateModuleVideoInput = Omit<ModuleVideo, "id" | "createdAt">;

// ——————————————————————————————————————————————
// TAREA DE MÓDULO — public.module_assignments
// 1 tarea por módulo. Las preguntas son un array de strings.
// Las respuestas de la alumna van en ModuleSubmission.answers (array paralelo).
// ——————————————————————————————————————————————
export interface ModuleAssignment {
  id: UUID;
  moduleId: UUID;
  title: string;
  instructions: string | null;
  /**
   * Array de enunciados de preguntas.
   * Ej: ["¿Qué aprendiste esta semana?", "¿Cómo lo aplicarías?"]
   */
  questions: string[];
  createdAt: ISODateString;
}

export type CreateModuleAssignmentInput = Omit<
  ModuleAssignment,
  "id" | "createdAt"
>;

// ——————————————————————————————————————————————
// ACTIVIDAD / EXAMEN FINAL — public.final_activities
// 1 por curso. Mismo patrón de preguntas que la tarea de módulo.
// Permite recuperación si la alumna reprueba.
// ——————————————————————————————————————————————
export interface FinalActivity {
  id: UUID;
  /** ID del producto (curso) al que pertenece */
  productId: UUID;
  title: string;
  instructions: string | null;
  questions: string[];
  createdAt: ISODateString;
}

export type CreateFinalActivityInput = Omit<FinalActivity, "id" | "createdAt">;
