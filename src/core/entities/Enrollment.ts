// ============================================================
// src/core/entities/Enrollment.ts
// v3: + EnrollmentSource, enrolled_by, order_id nullable.
//
// Registro de qué producto compró (o fue habilitado a) cada alumna.
// Al crearse (por cualquier vía), el trigger fn_expand_entitlements
// genera automáticamente los UserEntitlements de acceso.
// ============================================================

import type {
  UUID, ClerkUserId, ISODateString, EnrollmentStatus, EnrollmentSource,
} from './shared';

export interface Enrollment {
  id: UUID;
  studentId: ClerkUserId;
  productId: UUID;

  /**
   * FK a la orden de compra que originó la matrícula.
   * NULL cuando source = 'admin_direct': Hebe habilitó sin flujo de pago
   * (pago por WhatsApp, sin comprobante, cortesía, etc.).
   */
  orderId: UUID | null;

  /**
   * Cómo nació esta matrícula:
   * - 'payment_flow': trigger automático al confirmar un pago.
   * - 'admin_direct': Hebe la creó manualmente desde el admin.
   */
  source: EnrollmentSource;

  /**
   * Clerk ID de Hebe cuando source = 'admin_direct'.
   * NULL en el flujo de pago normal.
   */
  enrolledBy: ClerkUserId | null;

  status: EnrollmentStatus;

  startedAt: ISODateString;

  /**
   * Sellado al momento de la compra/habilitación.
   * Para programas: duración del programa (prevalece sobre productos incluidos).
   * Calculado: startedAt + products.access_duration_months.
   */
  expiresAt: ISODateString;

  /** 0 para cursos y talleres. 6 o 12 para programas. */
  sessionsTotal: number;
  /** Gestionado automáticamente por triggers SQL al reservar/cancelar. */
  sessionsUsed: number;

  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Helpers de dominio
export const isEnrollmentActive = (e: Enrollment): boolean =>
  e.status === 'active' && new Date(e.expiresAt) > new Date();

export const getRemainingSessionsCount = (e: Enrollment): number =>
  Math.max(0, e.sessionsTotal - e.sessionsUsed);

export const hasAvailableSessions = (e: Enrollment): boolean =>
  isEnrollmentActive(e) && e.sessionsUsed < e.sessionsTotal;

/** Input para que Hebe habilite un producto directamente (admin_direct) */
export type AdminDirectEnrollmentInput = {
  studentId: ClerkUserId;
  productId: UUID;
  enrolledBy: ClerkUserId;
  expiresAt: ISODateString;
  sessionsTotal?: number;
  notes?: string;
};

/** Input creado por el trigger de pago (payment_flow) */
export type PaymentFlowEnrollmentInput = {
  studentId: ClerkUserId;
  productId: UUID;
  orderId: UUID;
  expiresAt: ISODateString;
  sessionsTotal: number;
};