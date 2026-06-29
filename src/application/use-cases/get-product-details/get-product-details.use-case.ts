// ============================================================================
// src/application/use-cases/get-product-details/get-product-details.use-case.ts
//
// CASO DE USO
// ------------
// Obtiene toda la información necesaria para mostrar el interior
// de un Curso, Taller o Programa.
//
// Este caso de uso NO conoce Supabase.
// Solamente coordina repositorios.
//
// Flujo:
//
// 1. Buscar el producto completo mediante su slug.
// 2. Verificar que la alumna tenga acceso.
// 3. Construir el DTO.
//
// En versiones futuras irá solicitando:
//
// • módulos
// • avisos
// • reuniones
// • productos incluidos
// • progreso
// • etc.
//
// ============================================================================

import type { IEnrollmentRepository } from "@/core/repositories/IEnrollmentRepository";
import type { IProductDetailsRepository } from "@/core/repositories/IProductDetailsRepository";
import type { IModuleRepository } from "@/core/repositories/IModuleRepository";

import type { GetProductDetailsInput } from "./get-product-details.input.dto";
import type { GetProductDetailsOutput } from "./get-product-details.output.dto";

export class GetProductDetailsUseCase {
  //---------------------------------------------------------------------------
  // Repositorios
  //---------------------------------------------------------------------------

  private readonly productDetailsRepository: IProductDetailsRepository;

  private readonly enrollmentRepository: IEnrollmentRepository;

  private readonly moduleRepository: IModuleRepository;
  //---------------------------------------------------------------------------
  // Constructor
  //---------------------------------------------------------------------------

  constructor(
    productDetailsRepository: IProductDetailsRepository,
    enrollmentRepository: IEnrollmentRepository,
    moduleRepository: IModuleRepository,
  ) {
    this.productDetailsRepository = productDetailsRepository;
    this.enrollmentRepository = enrollmentRepository;
    this.moduleRepository = moduleRepository;
  }

  //---------------------------------------------------------------------------
  // Caso de uso
  //---------------------------------------------------------------------------

  // nota: en los execute de los CU es donde se usan ambos dtos: el de input como parametro y el de ouput como salida del CU

  async execute(
    input: GetProductDetailsInput,
  ): Promise<GetProductDetailsOutput> {
    //-----------------------------------------------------------------------
    // 1. Recuperar el producto completo.
    //-----------------------------------------------------------------------

    const product = await this.productDetailsRepository.findBySlug(
      input.productSlug,
    );

    if (!product) {
      throw new Error("Producto no encontrado.");
    }

    //-----------------------------------------------------------------------
    // 2. Verificar que la alumna tenga acceso.
    //-----------------------------------------------------------------------

    const enrollment =
      await this.enrollmentRepository.findActiveByStudentAndProduct(
        input.studentId,
        product.id,
      );

    if (!enrollment) {
      throw new Error("La alumna no tiene acceso a este producto.");
    }

    //-----------------------------------------------------------------------
    // 3. Construir el DTO.
    //
    // De momento solamente devolvemos la información
    // que ya tenemos disponible.
    //
    // Poco a poco iremos completando:
    //
    // • módulos
    // • anuncios
    // • reuniones
    // • productos incluidos
    // • etc.
    //-----------------------------------------------------------------------

    return {
      product,

      enrollment: {
        expiresAt: enrollment.expiresAt,

        progressPercentage: 0,

        sessionsRemaining: enrollment.sessionsTotal - enrollment.sessionsUsed,
      },

      announcements: [],

      modules: [],

      includedProducts: [],
    };
  }
}
