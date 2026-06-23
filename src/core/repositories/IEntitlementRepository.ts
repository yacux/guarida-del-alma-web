// ============================================================
// src/core/repositories/IEntitlementRepository.ts
//
// Contrato para consultar los permisos efectivos de acceso.
//
// Los Entitlements representan la fuente de verdad de acceso
// a contenidos dentro de la plataforma.
//
// Esta interfaz pertenece al Core y es utilizada por Casos de
// Uso y validaciones de autorización.
// ============================================================

import { UserEntitlement } from "../entities/Entitlement";
import { ClerkUserId, UUID } from "../entities/shared";

export interface IEntitlementRepository {
  /**
   * Devuelve todos los permisos activos de una alumna.
   */
  findActiveByStudentId(studentId: ClerkUserId): Promise<UserEntitlement[]>;

  /**
   * Indica si una alumna posee acceso vigente a un producto.
   */
  hasAccessToProduct(studentId: ClerkUserId, productId: UUID): Promise<boolean>;
}
