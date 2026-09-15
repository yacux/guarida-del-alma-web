// ============================================================
// src/application/use-cases/get-session-balance/GetSessionBalanceUseCase.output.dto.ts
// ============================================================

export interface GetSessionBalanceOutputDTO {
  enrollmentId: string | null; // null si no hay enrollment activo con sesiones
  sessionsIncluded: number;
  sessionsUsed: number;
  sessionsRemaining: number;
}
