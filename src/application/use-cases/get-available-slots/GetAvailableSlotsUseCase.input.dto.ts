// ============================================================
// src/application/use-cases/get-available-slots/GetAvailableSlotsUseCase.input.dto.ts
// ============================================================

export interface GetAvailableSlotsInputDTO {
  /** Inicio del rango, formato YYYY-MM-DD */
  startDate: string;
  /** Fin del rango, formato YYYY-MM-DD */
  endDate: string;
  /** Zona horaria de la alumna, ej. "America/Argentina/Buenos_Aires" */
  timeZone: string;
}
