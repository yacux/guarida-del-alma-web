// ============================================================
// src/core/repositories/IProductDetailsRepository.ts
//
// Contrato para reconstruir completamente un producto.
//
// A diferencia de IProductRepository,
// este repositorio devuelve el árbol completo
// de un Curso, Taller o Programa.
//
// Es utilizado únicamente por el caso de uso
// GetProductDetailsUseCase.
// ============================================================

import type { ProductVariant } from "../entities/Product";

export interface IProductDetailsRepository {
  /**
   * Busca un producto por slug y reconstruye
   * toda su información específica.
   *
   * Puede devolver:
   *
   * • Course
   * • Workshop
   * • Program
   */
  findBySlug(slug: string): Promise<ProductVariant | null>;
}
