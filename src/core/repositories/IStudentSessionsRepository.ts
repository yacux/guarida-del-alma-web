// ============================================================
// src/core/repositories/IStudentSessionsRepository.ts
//
// Contrato de lectura de sesiones individuales desde la perspectiva
// de la alumna. Implementado con el server client (respeta RLS).
// No confundir con ISessionRepository (webhook, service role).
// ============================================================

import type {
  SessionBalance,
  UpcomingSession,
} from "@/core/entities/IndividualSession";

export interface IStudentSessionsRepository {
  /**
   * Balance de sesiones de un enrollment puntual (student_id + product_id).
   * Devuelve null si no hay enrollment activo con sesiones para ese producto.
   */
  getSessionBalance(params: {
    studentId: string;
    productId: string;
  }): Promise<SessionBalance | null>;

  /**
   * Próximas sesiones confirmadas de un enrollment puntual.
   * Se filtra por enrollment_id (columna directa en historial_reservas),
   * no por student_id, para no traer sesiones de otros programas.
   */
  getUpcomingSessions(params: {
    enrollmentId: string;
  }): Promise<UpcomingSession[]>;
}
