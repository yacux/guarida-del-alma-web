// ============================================================
// src/core/auth/policies/module.policy.ts
//
// Reglas de negocio relacionadas con los módulos de un curso.
//
// IMPORTANTE
// ----------
// Estas reglas NO controlan el acceso a los datos.
// Eso ya lo hace Supabase mediante RLS.
//
// Aquí únicamente decidimos qué acciones puede realizar
// una alumna sobre un módulo al que ya tiene acceso.
// ============================================================

import type { ModuleProgress } from "@/core/entities/StudentProgress";
import type { ModuleSubmission } from "@/core/entities/Submission";

// ============================================================
// ¿Puede ver el módulo?
//
// El módulo debe estar desbloqueado.
// ============================================================

// ✅ canViewModule — RLS no tiene granularidad a nivel de módulo
// Las políticas de RLS dan acceso al producto completo.
// El control de qué módulo específico está disponible
// depende de student_module_progress, y esa decisión la hace TypeScript.
export function canViewModule(progress: ModuleProgress): boolean {
  return progress.isUnlocked;
}

// ============================================================
// ¿Puede entregar la tarea?
//
// Reglas:
//
// • El módulo debe estar desbloqueado.
// • Si nunca entregó, puede hacerlo.
// • Si la última entrega fue rechazada, puede re-entregar.
// • Si fue aprobada, ya no puede volver a entregar.
// ============================================================

export function canSubmitAssignment(
  progress: ModuleProgress,
  latestSubmission: ModuleSubmission | null,
): boolean {
  if (!progress.isUnlocked) {
    return false;
  }

  if (!latestSubmission) {
    return true;
  }

  return latestSubmission.status === "failed";
}
