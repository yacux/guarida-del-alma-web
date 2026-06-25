// ============================================================
// src/core/repositories/IMeetingRepository.ts
//
// Contrato de acceso a reuniones.
//
// Un curso o taller puede tener reuniones grupales.
// Un programa puede tener sesiones individuales.
//
// El caso de uso solo pide reuniones;
// la infraestructura decide cómo obtenerlas.
// ============================================================

import type { Meeting } from "../entities/Meeting";
import type { UUID } from "../entities/shared";

export interface IMeetingRepository {
  /**
   * Devuelve las reuniones asociadas a un producto.
   */
  findByProductId(productId: UUID): Promise<Meeting[]>;
}
