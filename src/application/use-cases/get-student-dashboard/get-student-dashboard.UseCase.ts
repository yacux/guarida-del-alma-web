// src/application/use-cases/get-student-dashboard/get-student-dashboard.use-case.ts

import type { IEnrollmentRepository } from "@/core/repositories/IEnrollmentRepository";
import type { IProductRepository } from "@/core/repositories/IProductRepository";
import type { StudentDashboardItem } from "./student-dashboard.output.dto";
import type { GetStudentDashboardInput } from "./get-student-dashboard.input.dto";

export class GetStudentDashboardUseCase {
  // 1. Aquí se definen tradicionalmente los atributos
  // (y con private readonly defines que son privados y de solo lectura)
  private readonly enrollmentRepository: IEnrollmentRepository;
  private readonly productRepository: IProductRepository;

  // 2. Aquí se definen los parámetros
  constructor(
    enrollmentRepository: IEnrollmentRepository,
    productRepository: IProductRepository,
  ) {
    // Aquí la asignación manual a las propiedades
    this.enrollmentRepository = enrollmentRepository;
    this.productRepository = productRepository;
  }

  // execute es el método principal que se llama para ejecutar el caso de uso.
  async execute(
    input: GetStudentDashboardInput,
  ): Promise<StudentDashboardItem[]> {
    // 1) VIAJE A LA DB 1: Traemos solo las matrículas vigentes de la alumna.
    const enrollments = await this.enrollmentRepository.findActiveByStudentId(
      input.studentId,
    );

    // OPTIMIZACIÓN "EARLY RETURN": Si la alumna es nueva y no compró nada,
    // cortamos la ejecución acá. Nos ahorramos hacer consultas de productos en vano.
    if (enrollments.length === 0) return [];

    // 2) EXTRACTOR DE IDs: Transformamos el array de matrículas en un array de strings
    // que solo contiene los IDs de los productos (ej: ['id-curso1', 'id-taller2']).
    const productIds = enrollments.map((e) => e.productId);

    // 3) VIAJE A LA DB 2 (MÁGICO): En vez de hacer un viaje a la DB por cada matrícula (lo cual sería lento),
    // el método 'findByIds' le pasa toda la lista junta a la base de datos y trae todos los productos de un solo tiro.
    const products = await this.productRepository.findByIds(productIds);

    // 4) EL CRUCE DE DATOS (MAPPING): Recorremos las matrículas y a cada una le buscamos su producto correspondiente
    // para "aplanar" la estructura y armar el DTO que la UI de React puede entender sin esfuerzo.
    return enrollments.map((enrollment) => {
      // Buscamos dentro de la lista de productos descargados el que coincide con esta matrícula
      const product = products.find((p) => p.id === enrollment.productId);

      // Si por un error de carga el producto no existiera, usamos el operador "??" (fallback)
      // para evitar que la pantalla se rompa y devuelva strings vacíos o genéricos.
      return {
        productId: enrollment.productId,
        name: product?.name ?? "Producto no encontrado",
        slug: product?.slug ?? "",
        productType: product?.productType ?? "course",
        coverImageUrl: product?.coverImageUrl ?? null,
        expiresAt: enrollment.expiresAt,
        progressPercentage: 0, // 🔮 NOTA DE GPT: El progreso vive en otra tabla, ya lo sumaremos con otro repositorio.
        isExpired: new Date(enrollment.expiresAt) < new Date(), // Cálculo lógico al vuelo
      };
    });
  }
}
