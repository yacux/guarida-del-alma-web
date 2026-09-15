// ============================================================
// src/application/use-cases/create-session-booking/CreateSessionBookingUseCase.output.dto.ts
// ============================================================

export type CreateSessionBookingOutputDTO =
  | { outcome: "created"; bookingUid: string }
  | { outcome: "no_sessions_available" }
  | { outcome: "calendar_error"; error: string };
