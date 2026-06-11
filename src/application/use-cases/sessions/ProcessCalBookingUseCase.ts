// ============================================================
// src/application/use-cases/sessions/ProcessCalBookingUseCase.ts
//
// Caso de uso central. Orquesta:
//   1. Llamada atómica a Supabase (RPC)
//   2. Si es rechazado → cancelación en Cal.com API
//   3. Si la cancelación falla → marcar para revisión manual
//
// NO conoce HTTP. NO conoce Express/Next.js.
// Solo orquesta repositorios y adaptadores.
// ============================================================

import type { ISessionRepository } from '@/core/repositories/ISessionRepository';
import type { CalComAdapter }       from '@/infrastructure/adapters/CalComAdapter';
import type { CalWebhookEvent, extractStudentEmail } from '@/core/entities/BookingHistory';
import { extractStudentEmail as getEmail } from '@/core/entities/BookingHistory';

export type ProcessBookingResult =
  | { outcome: 'confirmed'; sessionsRemaining: number; enrollmentId: string }
  | { outcome: 'rejected_and_cancelled'; reason: string }
  | { outcome: 'rejected_cancellation_failed'; reason: string; calError: string }
  | { outcome: 'idempotent'; previousStatus: string }
  | { outcome: 'invalid_payload'; detail: string };

export class ProcessCalBookingUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly calComAdapter: CalComAdapter,
  ) {}

  async execute(event: CalWebhookEvent): Promise<ProcessBookingResult> {
    const { payload } = event;

    // ── 1. Extraer email del asistente ────────────────────────
    const studentEmail = getEmail(payload);

    if (!studentEmail) {
      return {
        outcome: 'invalid_payload',
        detail:  'No se encontró email de asistente en el payload.',
      };
    }

    // Calcular duración en minutos desde startTime y endTime
    const startMs = new Date(payload.startTime).getTime();
    const endMs   = new Date(payload.endTime).getTime();
    const durationMinutes = Math.round((endMs - startMs) / 60_000) || 60;

    // ── 2. Decremento atómico en Supabase ─────────────────────
    const result = await this.sessionRepository.decrementSessionForBooking({
      studentEmail,
      calBookingId:   payload.bookingId,
      calBookingUid:  payload.uid,
      scheduledAt:    new Date(payload.startTime),
      durationMinutes,
      rawPayload:     payload,
    });

    // ── 3a. Idempotente: Cal.com reenvió un webhook ya procesado ──
    if (result.success && result.idempotent) {
      return { outcome: 'idempotent', previousStatus: 'confirmed' };
    }
    if (!result.success && result.idempotent) {
      return { outcome: 'idempotent', previousStatus: result.reason! };
    }

    // ── 3b. Sesión confirmada ────────────────────────────────
    if (result.success) {
      console.info(
        `[ProcessCalBooking] ✅ Confirmada. Alumna: ${studentEmail} | ` +
        `Booking: ${payload.bookingId} | Sesiones restantes: ${result.sessionsRemaining}`
      );
      return {
        outcome:           'confirmed',
        sessionsRemaining: result.sessionsRemaining,
        enrollmentId:      result.enrollmentId,
      };
    }

    // ── 3c. Sin sesiones disponibles → cancelar en Cal.com ───
    console.warn(
      `[ProcessCalBooking] ⚠️ Rechazada (${result.reason}). Alumna: ${studentEmail} | ` +
      `Booking: ${payload.bookingId}. Intentando cancelar en Cal.com...`
    );

    const cancelResult = await this.calComAdapter.cancelBooking({
      bookingUid: payload.uid,
      reason:
        result.reason === 'student_not_found'
          ? 'Usuario no registrado en la plataforma.'
          : 'No tienes sesiones individuales disponibles en tu plan.',
    });

    // ── 3d. Cancelación exitosa en Cal.com ───────────────────
    if (cancelResult.success) {
      console.info(
        `[ProcessCalBooking] ✅ Cancelación en Cal.com exitosa. Booking UID: ${payload.uid}`
      );
      return {
        outcome: 'rejected_and_cancelled',
        reason:  result.reason,
      };
    }

    // ── 3e. Cancelación fallida → marcar para revisión manual ─
    // La sesión NO fue decrementada (la RPC lo registró como 'rejected'),
    // pero el turno sigue visible en Cal.com. Necesita atención manual.
    console.error(
      `[ProcessCalBooking] ❌ Cancelación en Cal.com FALLÓ. ` +
      `Booking UID: ${payload.uid} | Error: ${cancelResult.error}. ` +
      `Marcando como cancellation_failed en historial.`
    );

    await this.sessionRepository.markCancellationFailed({
      calBookingId:  payload.bookingId,
      errorMessage:  cancelResult.error,
    });

    return {
      outcome:   'rejected_cancellation_failed',
      reason:    result.reason,
      calError:  cancelResult.error,
    };
  }
}