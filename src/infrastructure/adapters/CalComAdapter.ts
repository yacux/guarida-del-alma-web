// ============================================================
// src/infrastructure/adapters/CalComAdapter.ts
// Adaptador para la REST API de Cal.com.
// Responsabilidad única: cancelar un booking por su UID.
// ============================================================

export type CalCancelResult =
  | { success: true }
  | { success: false; error: string; statusCode?: number };

export class CalComAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.cal.com/v1';

  constructor() {
    const key = process.env.CAL_API_KEY;
    if (!key) {
      throw new Error('CAL_API_KEY no está definida en las variables de entorno.');
    }
    this.apiKey = key;
  }

  /**
   * Cancela un booking en Cal.com por su UID.
   * Cal.com endpoint: POST /v1/bookings/{uid}/cancel
   *
   * Se llama cuando nuestra DB rechaza la reserva (sin sesiones disponibles).
   * Si esta llamada falla, el booking queda en cal_booking_status = 'cancellation_failed'
   * para revisión manual.
   */
  async cancelBooking(params: {
    bookingUid: string;
    reason: string;
  }): Promise<CalCancelResult> {
    const url = `${this.baseUrl}/bookings/${params.bookingUid}/cancel`;

    try {
      const response = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          reason:    params.reason,
          allRemainingBookings: false,
        }),
        // Timeout de 10 segundos: Cal.com puede ser lento.
        // En Node 18+: AbortSignal.timeout(10_000)
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        return { success: true };
      }

      // Cal.com devuelve errores en JSON
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const errorMessage = typeof errorBody === 'object'
        ? JSON.stringify(errorBody)
        : String(errorBody);

      return {
        success:    false,
        error:      `Cal.com respondió ${response.status}: ${errorMessage}`,
        statusCode: response.status,
      };

    } catch (err) {
      // Error de red, timeout, DNS, etc.
      const message = err instanceof Error ? err.message : 'Error de red desconocido';
      return { success: false, error: message };
    }
  }
}