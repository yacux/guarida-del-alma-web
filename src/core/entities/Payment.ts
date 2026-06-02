// ============================================================
// src/core/entities/Payment.ts
// Órdenes de compra y pagos con 4 métodos.
//
// ┌─────────────────────────────────────────────────────────┐
// │  FLUJO AUTOMÁTICO (MercadoPago / PayPal)                │
// │  1. Alumna elige producto → se crea Order               │
// │  2. Alumna paga en la pasarela → se crea Payment        │
// │  3. Webhook de la pasarela llega → payment.status =     │
// │     'completed' → trigger SQL crea Enrollment           │
// ├─────────────────────────────────────────────────────────┤
// │  FLUJO MANUAL (Transferencia / Western Union)           │
// │  1. La plataforma muestra los datos bancarios/WU        │
// │  2. Alumna paga y envía comprobante a Hebe por WhatsApp │
// │     (FUERA de la plataforma — no se sube nada al sitio) │
// │  3. Hebe verifica el comprobante en WhatsApp            │
// │  4. Hebe va al admin → crea el Enrollment manualmente   │
// │     (opcionalmente registra un Payment 'completed'      │
// │      para trazabilidad contable)                        │
// └─────────────────────────────────────────────────────────┘
// ============================================================

import type {
  UUID,
  ClerkUserId,
  ISODateString,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './shared';

// ——————————————————————————————————————————————
// ORDEN — public.orders
// Una orden por intento de compra (cualquier método).
// ——————————————————————————————————————————————
export interface Order {
  id: UUID;
  /** Clerk User ID de la alumna que compra */
  studentId: ClerkUserId;
  productId: UUID;
  amount: number;
  /** Código ISO 4217. Ej: "USD", "ARS" */
  currency: string;
  status: OrderStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type CreateOrderInput = Pick<Order, 'studentId' | 'productId' | 'amount' | 'currency'>;

// ——————————————————————————————————————————————
// PAGO — public.payments
// Unión discriminada: AutomaticPayment vs ManualPayment
// ——————————————————————————————————————————————

interface PaymentBase {
  id: UUID;
  orderId: UUID;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Pago por pasarela AUTOMÁTICA (MercadoPago o PayPal).
 * Se confirma vía webhook; el externalId es el ID de la pasarela.
 */
export interface AutomaticPayment extends PaymentBase {
  method: 'mercadopago' | 'paypal';
  /** MP: preference_id. PayPal: order_id. */
  externalId: string;
  /** Estado raw devuelto por el gateway (para auditoría) */
  externalStatus: string | null;
  /** Payload completo del webhook para auditoría y disputas */
  webhookPayload: Record<string, unknown> | null;
  // Campos manuales no aplican
  approvedBy: null;
  approvedAt: null;
  notes: null;
}

/**
 * Pago MANUAL (Transferencia bancaria o Western Union).
 *
 * La plataforma NO recibe ni almacena el comprobante.
 * La alumna lo envía a Hebe por WhatsApp.
 * Hebe crea el Enrollment desde el admin y puede opcionalmente
 * registrar este Payment como 'completed' para contabilidad.
 */
export interface ManualPayment extends PaymentBase {
  method: 'bank_transfer' | 'western_union';
  // Campos automáticos no aplican
  externalId: null;
  externalStatus: null;
  webhookPayload: null;
  /** Clerk ID de Hebe que confirma el pago (siempre admin) */
  approvedBy: ClerkUserId | null;
  approvedAt: ISODateString | null;
  /** Notas internas de Hebe. Ej: "WU confirmado 12/06, código #ABC" */
  notes: string | null;
}

/** Unión discriminada de pagos */
export type Payment = AutomaticPayment | ManualPayment;

// Type guards
export const isAutomaticPaymentEntity = (p: Payment): p is AutomaticPayment =>
  p.method === 'mercadopago' || p.method === 'paypal';

export const isManualPaymentEntity = (p: Payment): p is ManualPayment =>
  p.method === 'bank_transfer' || p.method === 'western_union';

// ——————————————————————————————————————————————
// INPUT TYPES
// ——————————————————————————————————————————————

export type CreateAutomaticPaymentInput = Pick<
  AutomaticPayment,
  'orderId' | 'method' | 'amount' | 'currency' | 'externalId'
>;

/**
 * Hebe registra un pago manual desde el admin.
 * Lo más frecuente: directamente crea el Enrollment (ver EnrollmentRepository),
 * pero puede dejar registro contable creando este Payment.
 */
export type CreateManualPaymentInput = Pick<
  ManualPayment,
  'orderId' | 'method' | 'amount' | 'currency'
> & { notes?: string };

/**
 * Hebe confirma un pago manual como completado.
 * Esto puede disparar el trigger que crea el Enrollment si no lo creó antes.
 */
export type ConfirmManualPaymentInput = {
  paymentId: UUID;
  reviewerId: ClerkUserId;
  notes?: string;
};

// ——————————————————————————————————————————————
// HELPERS DE DOMINIO
// ——————————————————————————————————————————————

export const isPaymentCompleted = (p: Payment): boolean => p.status === 'completed';
export const isPaymentPending   = (p: Payment): boolean => p.status === 'pending';
export const isPaymentFailed    = (p: Payment): boolean => p.status === 'failed';