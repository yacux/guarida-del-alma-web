// ============================================================
// src/core/entities/Meeting.ts
// v4: sin inscripción obligatoria. Las reuniones son abiertas
// para todos los matriculados. La asistencia es voluntaria
// y se registra en MeetingAttendanceIntent.
// ============================================================

import type { UUID, ISODateString, MeetingType, ClerkUserId } from './shared';

// ——————————————————————————————————————————————
// REUNIÓN — public.meetings
// ——————————————————————————————————————————————
export interface Meeting {
  id: UUID;
  /**
   * El producto (curso o taller) al que pertenece esta reunión.
   * null solo en sesiones individuales 1-on-1.
   */
  productId: UUID | null;
  meetingType: MeetingType;
  title: string;
  description: string | null;
  scheduledAt: ISODateString;
  durationMinutes: number | null;
  /** Link de Zoom, Meet, etc. */
  meetingUrl: string | null;
  /**
   * URL de la grabación. Hebe la carga después de la reunión.
   * Disponible para quienes no pudieron asistir.
   */
  recordingUrl: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type CreateMeetingInput = Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateMeetingInput = Partial<
  Pick<Meeting, 'title' | 'description' | 'scheduledAt' | 'durationMinutes' | 'meetingUrl' | 'recordingUrl'>
>;

// ——————————————————————————————————————————————
// INTENCIÓN DE ASISTENCIA — public.meeting_attendance_intents
//
// Una alumna indica voluntariamente que planea asistir.
// No es un requisito de acceso; es solo para que Hebe
// estime cuántas alumnas irán a la reunión.
//
// El foro (announcements) es donde Hebe publica la reunión.
// Desde ese anuncio, la alumna puede registrar su intención.
// ——————————————————————————————————————————————
export interface MeetingAttendanceIntent {
  id: UUID;
  meetingId: UUID;
  /** Clerk ID de la alumna que indica que irá */
  studentId: ClerkUserId;
  /** Cuándo registró la intención */
  intentRegisteredAt: ISODateString;
  /**
   * null  = no marcado aún (intención registrada, reunión no ocurrió)
   * true  = asistió efectivamente
   * false = no asistió (Hebe puede marcar esto post-reunión)
   * Actualizado opcionalmente por Hebe después de la reunión.
   */
  attended: boolean | null;
}

export type CreateAttendanceIntentInput = Pick<
  MeetingAttendanceIntent,
  'meetingId' | 'studentId'
>;

// ——————————————————————————————————————————————
// HELPERS DE DOMINIO
// ——————————————————————————————————————————————

/** ¿La reunión ya ocurrió? */
export const hasMeetingPassed = (m: Meeting): boolean =>
  new Date(m.scheduledAt) < new Date();

/** ¿La grabación ya está disponible? */
export const hasRecording = (m: Meeting): boolean =>
  m.recordingUrl !== null && hasMeetingPassed(m);

/**
 * ¿Una alumna específica ya registró su intención para esta reunión?
 * Útil para mostrar el botón "Voy a ir" vs "Ya me anoté".
 */
export const hasRegisteredIntent = (
  intents: MeetingAttendanceIntent[],
  meetingId: UUID,
  studentId: ClerkUserId,
): boolean =>
  intents.some(i => i.meetingId === meetingId && i.studentId === studentId);