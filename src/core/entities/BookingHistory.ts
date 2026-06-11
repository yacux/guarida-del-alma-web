// ============================================================
// src/core/entities/BookingHistory.ts
// Entidad de dominio para el historial de reservas de Cal.com.
// ============================================================

import type { UUID, ClerkUserId, ISODateString } from './shared';

export type CalBookingStatus =
  | 'confirmed'             // Sesión decrementada, alumna tiene su turno
  | 'rejected'              // Sin sesiones → turno cancelado en Cal.com
  | 'cancellation_failed'   // Rechazada pero la llamada a Cal.com falló
  | 'cancelled_by_student'  // La alumna canceló desde Cal.com
  | 'completed'             // La sesión ocurrió
  | 'no_show';              // No se presentó

export interface BookingHistory {
  id: UUID;
  calBookingId: number;       // ID numérico de Cal.com
  calBookingUid: string;      // UID string de Cal.com (usado para cancelar)
  studentId: ClerkUserId | null;
  studentEmail: string;
  enrollmentId: UUID | null;
  scheduledAt: ISODateString;
  durationMinutes: number;
  status: CalBookingStatus;
  rejectionReason: string | null;
  calCancelError: string | null;  // Error al llamar a Cal.com API
  rawPayload: Record<string, unknown> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Resultado de la RPC fn_decrement_session_for_booking
export type DecrementSessionResult =
  | {
      success: true;
      idempotent?: boolean;
      enrollmentId: string;
      sessionsRemaining: number;
    }
  | {
      success: false;
      idempotent?: boolean;
      reason: 'student_not_found' | 'no_sessions_available';
    };

// ── Tipos del payload de Cal.com ──────────────────────────────

export interface CalAttendee {
  email: string;
  name: string;
  timeZone: string;
  locale?: string;
}

export interface CalOrganizer {
  email: string;
  name: string;
  timeZone: string;
}

export interface CalBookingPayload {
  bookingId: number;
  uid: string;
  title: string;
  startTime: string;   // ISO 8601
  endTime: string;     // ISO 8601
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  attendees: CalAttendee[];
  organizer: CalOrganizer;
  eventTypeId: number;
  eventTypeSlug?: string;
  metadata?: Record<string, unknown>;
  // Cal.com incluye el link de la reunión aquí si está configurado
  videoCallData?: {
    type: string;
    id: string;
    password?: string;
    url: string;
  };
}

export interface CalWebhookEvent {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED';
  createdAt: string;
  payload: CalBookingPayload;
}

// ── Helpers de dominio ────────────────────────────────────────

export const isBookingRejected = (b: BookingHistory): boolean =>
  b.status === 'rejected' || b.status === 'cancellation_failed';

export const needsManualAttention = (b: BookingHistory): boolean =>
  b.status === 'cancellation_failed';

/** Extrae el email del primer asistente (que no es el organizador) */
export const extractStudentEmail = (payload: CalBookingPayload): string | null => {
  const attendee = payload.attendees.find(
    a => a.email !== payload.organizer.email
  );
  return attendee?.email ?? null;
};