// ============================================================
// src/app/api/webhooks/cal/route.ts
//
// API Route de Next.js (App Router) que recibe webhooks de Cal.com.
//
// Responsabilidades de esta capa (solo HTTP):
//   1. Validar la firma del webhook (HMAC-SHA256)
//   2. Parsear y validar el payload
//   3. Delegar al caso de uso
//   4. Responder con el código HTTP correcto
//
// Variables de entorno requeridas (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
//   CAL_WEBHOOK_SECRET=...    ← secreto configurado en Cal.com Dashboard
//   CAL_API_KEY=...           ← API key de Cal.com para cancelar bookings
// ============================================================

import { NextRequest, NextResponse }  from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

import { SessionRepository }          from '@/infrastructure/repositories/SessionRepository';
import { CalComAdapter }              from '@/infrastructure/adapters/CalComAdapter';
import { ProcessCalBookingUseCase }   from '@/application/use-cases/sessions/ProcessCalBookingUseCase';
import type { CalWebhookEvent }       from '@/core/entities/BookingHistory';

// ── Instancias (singleton por módulo en Next.js) ─────────────
const sessionRepository = new SessionRepository();
const calComAdapter     = new CalComAdapter();
const processBooking    = new ProcessCalBookingUseCase(sessionRepository, calComAdapter);

// ── Validación de firma Cal.com ───────────────────────────────
/**
 * Cal.com envía el header X-Cal-Signature-256 con formato "sha256=<hex>".
 * Lo comparamos con HMAC-SHA256 del body raw usando nuestro webhook secret.
 * Usamos timingSafeEqual para prevenir timing attacks.
 */
function isSignatureValid(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET;

  // Si no hay secret configurado: en desarrollo lo permitimos, en producción bloqueamos.
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Cal Webhook] CAL_WEBHOOK_SECRET no configurado en producción.');
      return false;
    }
    console.warn('[Cal Webhook] ⚠️ CAL_WEBHOOK_SECRET no configurado. Saltando validación (solo dev).');
    return true;
  }

  if (!signatureHeader) return false;

  // Cal.com envía "sha256=abc123..."
  const [algo, receivedHex] = signatureHeader.split('=');
  if (algo !== 'sha256' || !receivedHex) return false;

  const expectedHex = createHmac('sha256', secret)
    .update(rawBody, 'utf-8')
    .digest('hex');

  // Comparación segura en tiempo constante (previene timing attacks)
  try {
    return timingSafeEqual(
      Buffer.from(receivedHex, 'hex'),
      Buffer.from(expectedHex, 'hex'),
    );
  } catch {
    // Buffer.from puede fallar si el hex es inválido
    return false;
  }
}

// ── Handler principal ─────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Leer body como texto (necesario para validar firma) ──
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el body.' }, { status: 400 });
  }

  // ── 2. Validar firma ────────────────────────────────────────
  const signature = req.headers.get('x-cal-signature-256');

  if (!isSignatureValid(rawBody, signature)) {
    console.warn('[Cal Webhook] ❌ Firma inválida. Posible intento de falsificación.');
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 401 });
  }

  // ── 3. Parsear JSON ─────────────────────────────────────────
  let event: CalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as CalWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
  }

  // ── 4. Filtrar eventos que no nos interesan ─────────────────
  // Solo procesamos BOOKING_CREATED. En el futuro podemos manejar
  // BOOKING_CANCELLED para reintegrar la sesión automáticamente.
  if (event.triggerEvent !== 'BOOKING_CREATED') {
    console.info(`[Cal Webhook] Evento ignorado: ${event.triggerEvent}`);
    return NextResponse.json({ received: true, processed: false });
  }

  // ── 5. Validaciones mínimas del payload ─────────────────────
  if (!event.payload?.bookingId || !event.payload?.uid || !event.payload?.startTime) {
    console.error('[Cal Webhook] Payload BOOKING_CREATED incompleto:', event.payload);
    return NextResponse.json({ error: 'Payload incompleto.' }, { status: 400 });
  }

  // ── 6. Delegar al caso de uso ────────────────────────────────
  // IMPORTANTE: respondemos 200 a Cal.com ANTES de procesar para evitar
  // que Cal.com reintente por timeout. El procesamiento es asíncrono pero
  // la RPC de Supabase es suficientemente rápida (<100ms normalmente).
  // Si necesitaras más tiempo, usar una queue (ej: Inngest, Vercel Queue).

  try {
    const result = await processBooking.execute(event);

    switch (result.outcome) {
      case 'confirmed':
        return NextResponse.json({
          received:          true,
          outcome:           'confirmed',
          sessionsRemaining: result.sessionsRemaining,
        });

      case 'rejected_and_cancelled':
        // 200: Cal.com no debe reintentar, la cancelación fue exitosa.
        return NextResponse.json({
          received: true,
          outcome:  'rejected_and_cancelled',
          reason:   result.reason,
        });

      case 'rejected_cancellation_failed':
        // 200 igual: ya está registrado en historial para revisión manual.
        // No devolvemos 500 porque Cal.com reintentaría y causaría loops.
        console.error(
          `[Cal Webhook] 🚨 Requiere atención manual. ` +
          `Booking ${event.payload.bookingId} rechazado pero no cancelado en Cal.com.`
        );
        return NextResponse.json({
          received: true,
          outcome:  'rejected_cancellation_failed',
        });

      case 'idempotent':
        return NextResponse.json({
          received:       true,
          outcome:        'idempotent',
          previousStatus: result.previousStatus,
        });

      case 'invalid_payload':
        return NextResponse.json(
          { received: true, outcome: 'invalid_payload', detail: result.detail },
          { status: 400 }
        );
    }
  } catch (err) {
    // Error inesperado (ej: Supabase caído, error de red).
    // Devolvemos 500 para que Cal.com reintente (comportamiento correcto en este caso).
    const message = err instanceof Error ? err.message : 'Error interno desconocido.';
    console.error('[Cal Webhook] 💥 Error inesperado:', message);

    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

// Cal.com solo usa POST. Rechazar otros métodos explícitamente.
export function GET(): NextResponse {
  return NextResponse.json({ error: 'Método no permitido.' }, { status: 405 });
}