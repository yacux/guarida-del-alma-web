// ============================================================
// src/core/entities/IndividualSession.ts
// Tipos de dominio puros para el balance y las sesiones agendadas.
// ============================================================

export interface SessionBalance {
  enrollmentId: string;
  sessionsIncluded: number;
  sessionsUsed: number;
  sessionsRemaining: number;
}

export interface UpcomingSession {
  id: string;
  enrollmentId: string | null; // null si no hay enrollment activo con sesiones
  scheduledAt: Date;
  durationMinutes: number;
  calBookingUid: string;
}
