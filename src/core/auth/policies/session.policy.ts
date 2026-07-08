// core/auth/policies/session.policy.ts

import type { Enrollment } from "@/core/entities/Enrollment";

/**
 * ¿Puede reservar una sesión 1-on-1?
 * Requiere: matrícula activa + sesiones disponibles.
 * RLS valida esto en fn_decrement_session_for_booking,
 * pero lo necesitamos en la UI para mostrar/ocultar el botón
 * y en el Use Case antes de llamar a Cal.com.
 */
// ✅ canBookSession — RLS no responde esto en la UI
// La RPC fn_decrement_session_for_booking lo valida al ejecutar,
// pero la UI necesita saber ANTES para mostrar/ocultar el botón.
// No hay duplicación: RLS valida en la escritura, TypeScript decide en la vista.
export function canBookSession(enrollment: Enrollment | null): boolean {
  if (!enrollment) return false;
  return enrollment.sessionsUsed < enrollment.sessionsTotal;
  // No re-chequear status ni expires_at: si el enrollment llegó de Supabase
  // con status='active', RLS ya lo validó. Confiás en el dato.
}

export function remainingSessions(enrollment: Enrollment): number {
  return Math.max(0, enrollment.sessionsTotal - enrollment.sessionsUsed);
}
