// ============================================================
// src/core/repositories/ISessionRepository.ts
// Contrato puro del repositorio de sesiones.
// La implementación concreta vive en infrastructure/repositories/.
// ============================================================

import type {
  DecrementSessionResult,
  CalBookingPayload,
} from '../entities/BookingHistory';

export interface ISessionRepository {
  /**
   * Llama a la RPC fn_decrement_session_for_booking en Supabase.
   * Operación atómica con FOR UPDATE: previene race conditions.
   * Es idempotente: si cal_booking_id ya existe, retorna el resultado anterior.
   */
  decrementSessionForBooking(params: {
    studentEmail: string;
    calBookingId: number;
    calBookingUid: string;
    scheduledAt: Date;
    durationMinutes: number;
    rawPayload: CalBookingPayload;
  }): Promise<DecrementSessionResult>;

  /**
   * Actualiza el estado de una fila del historial a 'cancellation_failed'
   * cuando la llamada a Cal.com API falló después de un rechazo.
   */
  markCancellationFailed(params: {
    calBookingId: number;
    errorMessage: string;
  }): Promise<void>;
}