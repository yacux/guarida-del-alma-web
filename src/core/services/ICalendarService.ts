// ============================================================
// src/core/services/ICalendarService.ts
//
// Contrato de dominio para el proveedor de calendario/disponibilidad.
// No conoce Cal.com — solo el concepto de "slot disponible" y "booking".
// ============================================================

export interface CalendarSlot {
  /** Horario de inicio del slot, en ISO 8601 UTC. */
  start: string;
}

export interface CreateBookingParams {
  /** Horario elegido, en ISO 8601 UTC (debe coincidir con un slot devuelto por getAvailableSlots). */
  start: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimeZone: string;
}

export type CreateBookingResult =
  | { success: true; bookingUid: string }
  | { success: false; error: string };

export interface ICalendarService {
  /**
   * Horarios libres agrupados por día (clave: fecha ISO "YYYY-MM-DD").
   */
  getAvailableSlots(params: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    timeZone: string;
  }): Promise<Record<string, CalendarSlot[]>>;

  createBooking(params: CreateBookingParams): Promise<CreateBookingResult>;

  cancelBooking(params: {
    bookingUid: string;
    reason: string;
  }): Promise<{ success: true } | { success: false; error: string }>;
}
