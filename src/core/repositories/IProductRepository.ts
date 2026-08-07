// src/core/repositories/IProductRepository.ts

import type { Product } from "@/core/entities/Product";
import type { UUID } from "@/core/entities/shared";

export interface IProductRepository {
  /**
   * Recupera múltiples productos por sus IDs.
   * Usado por: GetStudentDashboardUseCase, GetProgramContentsUseCase
   */
  findByIds(productIds: UUID[]): Promise<Product[]>;

  /**
   * Busca un producto por su slug.
   * Usado por: GetProductDetailUseCase, GetProgramContentsUseCase
   */
  findBySlug(slug: string): Promise<Product | null>;
}
