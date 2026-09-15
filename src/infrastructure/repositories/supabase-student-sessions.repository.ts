// ============================================================
// src/infrastructure/repositories/supabase-student-sessions.repository.ts
//
// Implementación de IStudentSessionsRepository.
// Usa el server client normal (JWT de Clerk) — RLS es la autoridad
// final acá, no service role. La alumna solo puede leer lo suyo.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IStudentSessionsRepository } from "@/core/repositories/IStudentSessionsRepository";
import type {
  SessionBalance,
  UpcomingSession,
} from "@/core/entities/IndividualSession";

export class SupabaseStudentSessionsRepository implements IStudentSessionsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getSessionBalance(params: {
    studentId: string;
    productId: string;
  }): Promise<SessionBalance | null> {
    const { data, error } = await this.supabase
      .from("enrollments")
      .select("id, sessions_total, sessions_used")
      .eq("student_id", params.studentId)
      .eq("product_id", params.productId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener balance de sesiones: ${error.message}`);
    }
    if (!data) return null;

    return {
      enrollmentId: data.id,
      sessionsIncluded: data.sessions_total,
      sessionsUsed: data.sessions_used,
      sessionsRemaining: data.sessions_total - data.sessions_used,
    };
  }

  async getUpcomingSessions(params: {
    enrollmentId: string;
  }): Promise<UpcomingSession[]> {
    const { data, error } = await this.supabase
      .from("historial_reservas")
      .select(
        "id, scheduled_at, duration_minutes, cal_booking_uid, enrollment_id",
      )
      .eq("enrollment_id", params.enrollmentId)
      .eq("status", "confirmed")
      .gt("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    if (error) {
      throw new Error(`Error al obtener próximas sesiones: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      scheduledAt: new Date(row.scheduled_at),
      durationMinutes: row.duration_minutes,
      calBookingUid: row.cal_booking_uid,
      enrollmentId: row.enrollment_id,
    }));
  }
}
