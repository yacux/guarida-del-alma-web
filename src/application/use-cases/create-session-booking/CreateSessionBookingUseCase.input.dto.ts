// ============================================================
// src/application/use-cases/create-session-booking/CreateSessionBookingUseCase.input.dto.ts
// ============================================================

export interface CreateSessionBookingInputDTO {
  studentId: string;
  productId: string;
  /** Horario elegido, ISO 8601 UTC — debe venir de GetAvailableSlotsUseCase */
  start: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimeZone: string;
}
