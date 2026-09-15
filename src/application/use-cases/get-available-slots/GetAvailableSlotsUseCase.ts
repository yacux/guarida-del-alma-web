// ============================================================
// src/application/use-cases/get-available-slots/GetAvailableSlotsUseCase.ts
//
// Consulta los horarios libres al proveedor de calendario.
// No conoce Cal.com — depende de ICalendarService.
//
// No valida saldo de sesiones: eso es responsabilidad de
// GetSessionBalanceUseCase (la UI decide si mostrar el selector).
// ============================================================

import type { ICalendarService } from "@/core/services/ICalendarService";
import type { GetAvailableSlotsInputDTO } from "./GetAvailableSlotsUseCase.input.dto";
import type { AvailableDayDTO } from "./GetAvailableSlotsUseCase.output.dto";

export class GetAvailableSlotsUseCase {
  constructor(private readonly calendarService: ICalendarService) {}

  async execute(input: GetAvailableSlotsInputDTO): Promise<AvailableDayDTO[]> {
    const slotsByDate = await this.calendarService.getAvailableSlots({
      startDate: input.startDate,
      endDate: input.endDate,
      timeZone: input.timeZone,
    });

    // Cal.com devuelve un objeto { "2026-09-20": [...], ... }.
    // Lo normalizamos a un array ordenado, más cómodo de mapear en la UI.
    return Object.entries(slotsByDate)
      .map(([date, slots]) => ({
        date,
        slots: slots.map((s) => s.start),
      }))
      .filter((day) => day.slots.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
