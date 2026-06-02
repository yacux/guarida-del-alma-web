// ============================================================
// src/core/entities/StudentProgress.ts
// Progreso de una alumna en los módulos de un curso.
// Un módulo se desbloquea al enviar la tarea del anterior
// (sin necesitar aprobación). El primer módulo se desbloquea
// automáticamente al matricularse.
// ============================================================

import type { UUID, ClerkUserId, ISODateString } from './shared';

/** Estado de un módulo individual para una alumna */
export interface ModuleProgress {
  id: UUID;
  /** Clerk User ID de la alumna */
  studentId: ClerkUserId;
  enrollmentId: UUID;
  moduleId: UUID;

  /** true una vez que el módulo está disponible para la alumna */
  isUnlocked: boolean;

  /** Cuándo se desbloqueó (null si aún está bloqueado) */
  unlockedAt: ISODateString | null;

  /** Cuándo la alumna envió la tarea (marca el módulo como completado) */
  completedAt: ISODateString | null;
}

// ——————————————————————————————————————————————
// HELPERS DE DOMINIO
// ——————————————————————————————————————————————

export const isModuleLocked     = (p: ModuleProgress): boolean => !p.isUnlocked;
export const isModuleCompleted  = (p: ModuleProgress): boolean => p.completedAt !== null;
export const isModuleInProgress = (p: ModuleProgress): boolean =>
  p.isUnlocked && p.completedAt === null;

/**
 * Calcula el porcentaje de avance de un curso dado el progreso de sus módulos.
 * "Completado" = se envió la tarea (independientemente de si fue aprobada).
 */
export const calculateCourseProgress = (progresses: ModuleProgress[]): number => {
  if (progresses.length === 0) return 0;
  const completed = progresses.filter(isModuleCompleted).length;
  return Math.round((completed / progresses.length) * 100);
};