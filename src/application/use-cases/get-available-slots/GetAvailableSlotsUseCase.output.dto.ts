// ============================================================
// src/application/use-cases/get-available-slots/GetAvailableSlotsUseCase.output.dto.ts
// ============================================================

export interface AvailableDayDTO {
  /** Fecha del día, formato YYYY-MM-DD */
  date: string;
  /** Horarios libres de ese día, en ISO 8601 UTC */
  slots: string[];
}
