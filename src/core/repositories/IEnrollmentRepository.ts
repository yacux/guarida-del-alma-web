// src/core/repositories/IEnrollmentRepository.ts
//
// Contrato para acceder a las matrículas (Enrollments) de una alumna.
//
//
// Los Casos de Uso dependen de esta interfaz para mantenerse
// completamente desacoplados de la infraestructura.
// ============================================================

import { Enrollment } from "../entities/Enrollment";
import { ClerkUserId, UUID } from "../entities/shared";

export interface IEnrollmentRepository {
  /**
   * Recupera todas las matrículas activas de una alumna.
   *
   * Una matrícula representa un producto comprado
   * (curso, taller o programa).
   *
   * Este método es utilizado principalmente por el
   * GetStudentDashboardUseCase.
   *
   * Flujo:
   *
   * 1. La alumna inicia sesión.
   * 2. El Dashboard necesita saber qué compró.
   * 3. Este método devuelve todas sus matrículas activas.
   * 4. Luego el Caso de Uso utiliza los productId obtenidos
   *    para pedir los productos al ProductRepository y
   *    construir las cards del Dashboard.
   * el CU es getStudentDashboardUseCase
   */
  findActiveByStudentId(studentId: ClerkUserId): Promise<Enrollment[]>;

  /**
   * Recupera la matrícula activa correspondiente
   * a un producto específico.
   *
   * Este método NO sirve para construir listados.
   *
   * Su objetivo es validar que la alumna realmente
   * tenga acceso antes de ingresar al contenido de
   * una formación.
   *
   * Es utilizado principalmente por el
   * GetProductDetailsUseCase.
   *
   * Flujo:
   *
   * 1. La alumna hace click en una card del Dashboard.
   *
   * 2. Next navega hacia:
   *
   *      /aula-virtual/desata-tu-voz
   *
   * 3. El Caso de Uso obtiene el producto mediante
   *    su slug.
   *
   * 4. Luego utiliza este método para comprobar que
   *    existe una matrícula activa que relacione:
   *
   *      Alumna + Producto
   *
   * 5. Si no existe esa matrícula, el Caso de Uso
   *    lanza un error y no permite acceder al contenido.
   */
  findActiveByStudentAndProduct(
    studentId: ClerkUserId,
    productId: UUID,
  ): Promise<Enrollment | null>;
}
