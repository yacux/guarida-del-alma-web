// ============================================================
// src/application/use-cases/get-upcoming-sessions/GetUpcomingSessionsUseCase.output.dto.ts
// ============================================================

export interface UpcomingSessionDTO {
  id: string;
  scheduledAt: string; // ISO string, la serialización queda del lado de presentación
  durationMinutes: number;
}
