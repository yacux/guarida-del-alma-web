// ============================================================
// src/application/use-cases/create-session-booking/CreateSessionBookingUseCase.ts
//
// Orquesta la creación de una reserva desde el lado de la alumna.
//
// IMPORTANTE — sobre la validación de saldo:
// El chequeo de sessionsRemaining acá es OPTIMISTA (evita crear un
// booking que el webhook va a rechazar y cancelar segundos después).
// NO es la autoridad final: la verdad la dicta la RPC atómica
// fn_decrement_session_for_booking cuando llega BOOKING_CREATED,
// con FOR UPDATE previniendo race conditions.
//
// Este use case NO escribe en Supabase. La escritura ocurre
// exclusivamente en el webhook (ProcessCalBookingUseCase, service role).
// ============================================================

import type { ICalendarService } from "@/core/services/ICalendarService";
import type { IStudentSessionsRepository } from "@/core/repositories/IStudentSessionsRepository";
import type { CreateSessionBookingInputDTO } from "./CreateSessionBookingUseCase.input.dto";
import type { CreateSessionBookingOutputDTO } from "./CreateSessionBookingUseCase.output.dto";

export class CreateSessionBookingUseCase {
  constructor(
    private readonly sessionsRepository: IStudentSessionsRepository,
    private readonly calendarService: ICalendarService,
  ) {}

  async execute(
    input: CreateSessionBookingInputDTO,
  ): Promise<CreateSessionBookingOutputDTO> {
    // ── 1. Chequeo optimista de saldo ────────────────────────
    const balance = await this.sessionsRepository.getSessionBalance({
      studentId: input.studentId,
      productId: input.productId,
    });

    if (!balance || balance.sessionsRemaining <= 0) {
      return { outcome: "no_sessions_available" };
    }

    // ── 2. Crear el booking en el proveedor de calendario ────
    const result = await this.calendarService.createBooking({
      start: input.start,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      attendeeTimeZone: input.attendeeTimeZone,
    });

    if (!result.success) {
      return { outcome: "calendar_error", error: result.error };
    }

    // ── 3. Listo. El webhook confirmará y descontará la sesión ──
    return { outcome: "created", bookingUid: result.bookingUid };
  }
}