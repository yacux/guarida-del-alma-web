// ============================================================
// src/infrastructure/adapters/CalComAdapter.ts
//
// Adaptador para la REST API v2 de Cal.com.
// Implementa ICalendarService: consulta de slots, creación y
// cancelación de bookings.
//
// IMPORTANTE: API v1 fue dada de baja el 8 de abril de 2026.
// Este adapter usa exclusivamente v2 (api.cal.com/v2).
// ============================================================

import type {
  ICalendarService,
  CalendarSlot,
  CreateBookingParams,
  CreateBookingResult,
} from "@/core/services/ICalendarService";

// Cada endpoint de v2 tiene su propia versión de header — no son intercambiables.
const CAL_API_VERSION_SLOTS = "2024-09-04";
const CAL_API_VERSION_BOOKINGS = "2024-08-13";

export class CalComAdapter implements ICalendarService {
  private readonly apiKey: string;
  private readonly eventTypeId: number;
  private readonly baseUrl = "https://api.cal.com/v2";

  constructor() {
    const key = process.env.CAL_API_KEY;
    const eventTypeId = process.env.CAL_EVENT_TYPE_ID;

    if (!key) {
      throw new Error(
        "CAL_API_KEY no está definida en las variables de entorno.",
      );
    }
    if (!eventTypeId) {
      throw new Error(
        "CAL_EVENT_TYPE_ID no está definida en las variables de entorno.",
      );
    }

    this.apiKey = key;
    this.eventTypeId = Number(eventTypeId);
  }

  private authHeaders(apiVersion: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "cal-api-version": apiVersion,
    };
  }

  /**
   * Consulta horarios disponibles para el event type de sesión individual.
   * Cal.com devuelve los slots agrupados por fecha (YYYY-MM-DD).
   */
  async getAvailableSlots(params: {
    startDate: string;
    endDate: string;
    timeZone: string;
  }): Promise<Record<string, CalendarSlot[]>> {
    const url = new URL(`${this.baseUrl}/slots`);
    url.searchParams.set("eventTypeId", String(this.eventTypeId));
    url.searchParams.set("start", params.startDate);
    url.searchParams.set("end", params.endDate);
    url.searchParams.set("timeZone", params.timeZone);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.authHeaders(CAL_API_VERSION_SLOTS),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Cal.com /slots respondió ${response.status}: ${errorBody}`,
      );
    }

    const body = await response.json();
    // Forma esperada: { data: { "2026-08-28": [{ start: "..." }, ...], ... } }
    return body.data ?? {};
  }

  /**
   * Crea un booking directo (no reserva-y-confirma-después).
   * El webhook BOOKING_CREATED sigue siendo la fuente de verdad que
   * confirma o rechaza contra el saldo real de sesiones (ProcessCalBookingUseCase).
   * Esto es solo el disparo desde el lado de la alumna.
   */
  async createBooking(
    params: CreateBookingParams,
  ): Promise<CreateBookingResult> {
    const url = `${this.baseUrl}/bookings`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.authHeaders(CAL_API_VERSION_BOOKINGS),
        body: JSON.stringify({
          start: params.start,
          eventTypeId: this.eventTypeId,
          attendee: {
            name: params.attendeeName,
            email: params.attendeeEmail,
            timeZone: params.attendeeTimeZone,
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });

      const body = await response.json();

      if (!response.ok) {
        const message =
          typeof body === "object" ? JSON.stringify(body) : String(body);
        return {
          success: false,
          error: `Cal.com respondió ${response.status}: ${message}`,
        };
      }

      const bookingUid: string | undefined = body?.data?.uid;
      if (!bookingUid) {
        return {
          success: false,
          error: "Cal.com no devolvió un booking UID válido.",
        };
      }

      return { success: true, bookingUid };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error de red desconocido";
      return { success: false, error: message };
    }
  }

  /**
   * Cancela un booking en Cal.com por su UID.
   * Cal.com v2 endpoint: POST /v2/bookings/{uid}/cancel
   *
   * Se llama cuando nuestra DB rechaza la reserva (sin sesiones disponibles),
   * o cuando la alumna cancela desde Guarida.
   */
  async cancelBooking(params: {
    bookingUid: string;
    reason: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    const url = `${this.baseUrl}/bookings/${params.bookingUid}/cancel`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.authHeaders(CAL_API_VERSION_BOOKINGS),
        body: JSON.stringify({
          cancellationReason: params.reason,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        return { success: true };
      }

      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const errorMessage =
        typeof errorBody === "object"
          ? JSON.stringify(errorBody)
          : String(errorBody);

      return {
        success: false,
        error: `Cal.com respondió ${response.status}: ${errorMessage}`,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error de red desconocido";
      return { success: false, error: message };
    }
  }
}
