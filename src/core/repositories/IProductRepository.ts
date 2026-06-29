// ============================================================
// src/core/repositories/IProductRepository.ts
//
// Contrato para consultar productos del catálogo.
// quien va a usar esta interfaz es la clase ProductRepository, que es la que sabe de supabase
// ProductRepository (en infrastructure) es la que va a usar el caso de uso GetStudentDashboardUseCase, que es el que tiene q mostrar los productos qeu compro la alimna, O SEA LOS ENROLLMENTS, NO LOS ENTITLEMENTS.
//
// en infrastructure, la clase ProductRepository va a implementar esta interfaz y va a saber de supabase, va a hacer la query a supabase para traer los productos del catalogo
//
// El caso de uso del Dashboard necesita recuperar los productos
// asociados a las matrículas de la alumna.
//
// Esta interfaz pertenece al Core y no conoce detalles de
// Supabase.
// ============================================================
import { Product } from "../entities/Product";
import { UUID } from "../entities/shared";

export interface IProductRepository {
  /**
   * Recupera múltiples productos a partir de sus IDs.
   * lo uso en el CU getStudentDashboardUseCase que trae todos los productos asociados a los enrollments de la alumna
   */
  findByIds(productIds: UUID[]): Promise<Product[]>;
  /**
   * Busca un producto por su slug.
   * un slug es el identificador único de un producto en la URL, por ejemplo: /aula-virtual/desata-tu-voz
   *
   *
   * usado en el CU getProductDetailUseCase para mostrar el "detalle" de un producto
   *
   */
  findBySlug(slug: string): Promise<Product | null>;
}
