// LO QUE HACE ESTE CASO DE USO:
// Input:  { programSlug: string }
// 1. Obtener el programa por slug            → IProductDetailsRepository
// 2. Verificar que es de tipo 'program'      → dominio puro
// 3. Extraer includedProductIds              → programDetails
// 4. Buscar los productos incluidos por IDs  → IProductRepository.findByIds
// 5. Retornar el programa + productos        → Output DTO
// Output: { program: Program, includedProducts: Product[] }

//----------------------------------------------------
// LO QUE NO HACE ESTE CASO DE USO:

// Verificar acceso: eso lo hace RLS y el middleware
// Reconstruir variantes de los productos incluidos: el output muestra cards, no el detalle completo

// src/application/use-cases/program/GetProgramPageUseCase.ts

// ============================================================
// src/application/use-cases/program/GetProgramPageUseCase.ts
// ============================================================

import type { IProductDetailsRepository } from "@/core/repositories/IProductDetailsRepository";
import type { IProductRepository } from "@/core/repositories/IProductRepository";
import type { IAnnouncementRepository } from "@/core/repositories/IAnnouncementRepository";
import type { GetProgramPageInput } from "./GetProgramPageUseCase.input.dto";
import type { GetProgramPageOutput } from "./GetProgramPageUseCase.output.dto";
import { isProgram } from "@/core/entities/Product";

export class GetProgramPageUseCase {
  constructor(
    private readonly productDetailsRepository: IProductDetailsRepository,
    private readonly productRepository: IProductRepository,
    private readonly announcementRepository: IAnnouncementRepository,
  ) {}

  async execute(
    input: GetProgramPageInput,
  ): Promise<GetProgramPageOutput | null> {
    // ── Paso 1: resolver el programa por slug ──────────────────
    // null = no encontrado (la page decide hacer notFound())
    // throw = error real de infraestructura
    const variant = await this.productDetailsRepository.findBySlug(
      input.programSlug,
    );

    if (!variant) return null;
    if (!isProgram(variant)) return null;

    const { includedProductIds } = variant.programDetails;

    // ── Paso 2: queries en paralelo ────────────────────────────
    // Ahora que tenemos el ID del programa, disparamos ambas
    // consultas al mismo tiempo para no hacer un waterfall.
    const [includedProducts, announcements] = await Promise.all([
      includedProductIds.length > 0
        ? this.productRepository.findByIds(includedProductIds)
        : Promise.resolve([]),
      this.announcementRepository.findByProductId(variant.id),
    ]);

    return {
      program: variant,
      includedProducts,
      announcements,
    };
  }
}
