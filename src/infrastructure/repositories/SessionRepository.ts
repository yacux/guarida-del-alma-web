// ============================================================
// src/infrastructure/repositories/SessionRepository.ts
// Implementación concreta del ISessionRepository usando Supabase.
// Usa el SERVICE ROLE CLIENT (bypass RLS) porque es llamado
// desde una API Route de servidor (webhook), no desde el cliente.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { ISessionRepository } from '@/core/repositories/ISessionRepository';
import type {
  DecrementSessionResult,
  CalBookingPayload,
} from '@/core/entities/BookingHistory';

// Cliente con service role para operaciones de servidor.
// NUNCA exponer SUPABASE_SERVICE_ROLE_KEY al cliente.
function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Shape del JSONB que devuelve la RPC
interface RpcResult {
  success: boolean;
  idempotent?: boolean;
  status?: string;              // presente cuando idempotent = true
  reason?: string;              // presente cuando success = false
  enrollment_id?: string;       // presente cuando success = true
  sessions_remaining?: number;  // presente cuando success = true
}

export class SessionRepository implements ISessionRepository {
  async decrementSessionForBooking(params: {
    studentEmail: string;
    calBookingId: number;
    calBookingUid: string;
    scheduledAt: Date;
    durationMinutes: number;
    rawPayload: CalBookingPayload;
  }): Promise<DecrementSessionResult> {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase.rpc(
      'fn_decrement_session_for_booking',
      {
        p_student_email:    params.studentEmail,
        p_cal_booking_id:   params.calBookingId,
        p_cal_booking_uid:  params.calBookingUid,
        p_scheduled_at:     params.scheduledAt.toISOString(),
        p_duration_minutes: params.durationMinutes,
        p_raw_payload:      params.rawPayload,
      }
    );

    if (error) {
      // Error de conexión o error en la función PL/pgSQL
      throw new Error(`Error en RPC fn_decrement_session_for_booking: ${error.message}`);
    }

    const result = data as RpcResult;

    if (result.success) {
      return {
        success:           true,
        idempotent:        result.idempotent,
        enrollmentId:      result.enrollment_id!,
        sessionsRemaining: result.sessions_remaining!,
      };
    }

    return {
      success:    false,
      idempotent: result.idempotent,
      reason:     result.reason as 'student_not_found' | 'no_sessions_available',
    };
  }

  async markCancellationFailed(params: {
    calBookingId: number;
    errorMessage: string;
  }): Promise<void> {
    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from('historial_reservas')
      .update({
        status:           'cancellation_failed',
        cal_cancel_error: params.errorMessage,
        updated_at:       new Date().toISOString(),
      })
      .eq('cal_booking_id', params.calBookingId);

    if (error) {
      // Loggear pero no relanzar: ya estamos en un path de error,
      // no queremos enmascarar el error original.
      console.error(
        '[SessionRepository] Error al marcar cancellation_failed:',
        error.message
      );
    }
  }
}