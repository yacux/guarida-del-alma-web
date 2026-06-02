// ============================================================
// src/core/entities/Session.ts
// Disponibilidad de Hebe y reservas de sesiones individuales 1-on-1.
// Las alumnas con programa (Ave Fénix o Flor de Loto) pueden reservar
// dentro de los slots disponibles, respetando su límite de sesiones.
// ============================================================

import type { UUID, ClerkUserId, ISODateString, BookingStatus } from './shared';

// ——————————————————————————————————————————————
// DISPONIBILIDAD DE HEBE — public.teacher_availability
// Hebe define bloques de tiempo desde el panel de admin.
// ——————————————————————————————————————————————
export interface TeacherAvailability {
  id: UUID;
  /** ID de Hebe (siempre admin) */
  /** Clerk User ID de Hebe */
  teacherId: ClerkUserId;
  /** Inicio del bloque de tiempo disponible */
  startAt: ISODateString;
  /** Fin del bloque de tiempo disponible (mín. 30 minutos después de startAt) */
  endAt: ISODateString;
  /** true cuando una alumna ya reservó este slot */
  isBooked: boolean;
  createdAt: ISODateString;
}

export type CreateTeacherAvailabilityInput = Omit<
  TeacherAvailability,
  'id' | 'isBooked' | 'createdAt'
>;

/** ¿El slot está disponible para reservar? */
export const isSlotAvailable = (slot: TeacherAvailability): boolean =>
  !slot.isBooked && new Date(slot.startAt) > new Date();

/** Duración del slot en minutos */
export const getSlotDurationMinutes = (slot: TeacherAvailability): number =>
  Math.round(
    (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60_000
  );

// ——————————————————————————————————————————————
// RESERVA DE SESIÓN INDIVIDUAL — public.individual_session_bookings
// ——————————————————————————————————————————————
export interface IndividualSessionBooking {
  id: UUID;
  /**
   * La matrícula activa del programa de la alumna.
   * Controla que sessions_used < sessions_total.
   */
  enrollmentId: UUID;
  /** Clerk User ID de la alumna */
  studentId: ClerkUserId;
  /** Slot de disponibilidad que la alumna reserva */
  availabilityId: UUID;
  /**
   * La reunión 1-on-1 que se crea automáticamente al reservar.
   * null hasta que Hebe la crea o el sistema la genera.
   */
  meetingId: UUID | null;
  status: BookingStatus;
  bookedAt: ISODateString;
  /** Notas opcionales de la alumna al reservar (ej. tema a tratar) */
  notes: string | null;
}

export type CreateIndividualSessionBookingInput = Pick<
  IndividualSessionBooking,
  'enrollmentId' | 'studentId' | 'availabilityId' | 'notes'
>;

/** ¿Puede la alumna cancelar esta reserva? */
export const canCancelBooking = (b: IndividualSessionBooking): boolean =>
  b.status === 'scheduled';