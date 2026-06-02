// ============================================================
// src/core/entities/shared.ts
// v3: + EnrollmentSource, awaiting_approval en PaymentStatus
// ============================================================

export type UUID = string;
export type ISODateString = string;

/**
 * Clerk User ID. Formato: "user_2abc123xyz".
 * PK en profiles. FK en todas las relaciones de usuario.
 */
export type ClerkUserId = string;

// ——————————————————————————————————————————————
// Roles
// ——————————————————————————————————————————————
export type UserRole = 'student' | 'admin';

// ——————————————————————————————————————————————
// Productos
// ——————————————————————————————————————————————
export type ProductType = 'course' | 'workshop' | 'program';

// ——————————————————————————————————————————————
// Matrículas
// ——————————————————————————————————————————————
export type EnrollmentStatus = 'active' | 'expired' | 'cancelled';

/**
 * Distingue cómo nació una matrícula.
 * Permite que Hebe habilite accesos sin pasar por el flujo de pago.
 */
export type EnrollmentSource =
  | 'payment_flow'  // Trigger automático al confirmar un pago
  | 'admin_direct'; // Hebe lo habilitó manualmente (pago por WA, cortesía, etc.)

// ——————————————————————————————————————————————
// Entregas
// ——————————————————————————————————————————————
export type SubmissionStatus =
  | 'pending_review'
  | 'approved'
  | 'failed'
  | 'recovery_pending';

// ——————————————————————————————————————————————
// Reuniones
// ——————————————————————————————————————————————
export type MeetingType =
  | 'monthly_course'     // reunión en vivo de un curso (abierta a todos los matriculados)
  | 'workshop_live'      // reunión en vivo de un taller (abierta a todos los matriculados)
  | 'program_exclusive'  // encuentro exclusivo de un programa
  | 'individual_session'; // sesión 1-on-1 con Hebe

export type BookingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

// ——————————————————————————————————————————————
// Pagos
// ——————————————————————————————————————————————
export type PaymentMethod =
  | 'mercadopago'
  | 'paypal'
  | 'bank_transfer'
  | 'western_union';

export type PaymentStatus =
  | 'pending'            // Pago iniciado / comprobante no subido aún
  | 'awaiting_approval'  // Comprobante subido, Hebe debe revisar (solo manuales)
  | 'completed'          // Confirmado → genera matrícula
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'cancelled'
  | 'refunded';

// Helpers de clasificación de métodos de pago
export const AUTOMATIC_METHODS: PaymentMethod[] = ['mercadopago', 'paypal'];
export const MANUAL_METHODS: PaymentMethod[]    = ['bank_transfer', 'western_union'];

export const isAutomaticPayment = (m: PaymentMethod): boolean =>
  AUTOMATIC_METHODS.includes(m);
export const isManualPayment = (m: PaymentMethod): boolean =>
  MANUAL_METHODS.includes(m);