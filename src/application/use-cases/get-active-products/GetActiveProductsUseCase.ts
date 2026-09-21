// ============================================================
// src/application/use-cases/get-active-products/GetActiveProductsUseCase.ts
// ============================================================
import type { IProductRepository } from "@/core/repositories/IProductRepository";
import type { Product } from "@/core/entities/Product";

export class GetActiveProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAllActive();
  }
}
