// ============================================================
// src/core/entities/Entitlement.ts
// [NUEVO v3] Derechos de acceso efectivos.
//
// Separa "qué se compró" (Enrollment) de "a qué se accede" (Entitlement).
//
// Cuándo se crea:
//   Trigger fn_expand_entitlements_on_enrollment en Supabase.
//   Al crearse cualquier Enrollment (por pago o por admin):
//     • Curso / Taller → 1 Entitlement para ese producto.
//     • Programa      → N Entitlements, uno por cada producto
//                       en program_included_products,
//                       todos con expires_at del PROGRAMA.
//
// Cómo se usa:
//   fn_has_access_to_product(userId, productId) → boolean
//   Es la fuente de verdad de acceso para RLS y middleware de Next.js.
// ============================================================

import type { UUID, ClerkUserId, ISODateString } from './shared';

export interface UserEntitlement {
  id: UUID;
  /** Clerk ID de la alumna */
  studentId: ClerkUserId;
  /**
   * El producto CONCRETO al que tiene acceso.
   * Si compró un programa, habrá una fila por cada producto del programa.
   */
  productId: UUID;
  /**
   * La matrícula que generó este entitlement.
   * Si compró Ave Fénix (programa), todas las filas de sus 4 productos
   * apuntan a la misma matrícula del programa.
   */
  sourceEnrollmentId: UUID;
  /**
   * Fecha de vencimiento sellada al momento de la compra.
   * Para productos incluidos en un programa, es el expires_at
   * del PROGRAMA (no el del producto individual).
   * Ej: si Ave Fénix dura 12m y Desata tu Voz dura 3m,
   *     el entitlement de Desata tu Voz vence en 12m.
   */
  expiresAt: ISODateString;
  isActive: boolean;
  createdAt: ISODateString;
}

// ——————————————————————————————————————————————
// HELPERS DE DOMINIO
// ——————————————————————————————————————————————

/** ¿El entitlement está vigente en este momento? */
export const isEntitlementValid = (e: UserEntitlement): boolean =>
  e.isActive && new Date(e.expiresAt) > new Date();

/**
 * Versión client-side de fn_has_access_to_product.
 * Útil en casos de uso que ya tienen los entitlements cargados
 * y no quieren hacer una llamada extra a la DB.
 */
export const hasAccessToProduct = (
  entitlements: UserEntitlement[],
  productId: UUID,
): boolean =>
  entitlements.some(e => e.productId === productId && isEntitlementValid(e));

/**
 * Devuelve todos los productos a los que una alumna tiene acceso actualmente.
 * Útil para renderizar el "dashboard" de la alumna.
 */
export const getActiveProductIds = (entitlements: UserEntitlement[]): UUID[] =>
  [...new Set(
    entitlements.filter(isEntitlementValid).map(e => e.productId)
  )];