// ============================================================
// src/core/repositories/IAnnouncementRepository.ts
//
// Contrato de acceso al foro de avisos.
//
// El caso de uso no sabe si los avisos viven en Supabase,
// PostgreSQL, Firebase o una API externa.
// Solo sabe que puede pedir los avisos de un producto.
// ============================================================

import type { Announcement } from "../entities/Announcement";
import type { UUID } from "../entities/shared";

export interface IAnnouncementRepository {
  /**
   * Devuelve todos los avisos de un producto.
   *
   * Ej:
   * - Curso "Desata tu Voz"
   * - Taller "Niña Interior"
   * - Programa "Flor de Loto"
   */
  findByProductId(productId: UUID): Promise<Announcement[]>;
}
