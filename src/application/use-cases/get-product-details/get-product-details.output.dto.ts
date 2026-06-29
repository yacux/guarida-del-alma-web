// ============================================================================
// src/application/use-cases/get-product-details/get-product-details.output.dto.ts
//
// OUTPUT DTO
// ----------
// Este DTO representa exactamente los datos que necesita la pantalla
// de detalle de un producto.
//
// No representa la base de datos.
// No representa una entidad persistida.
//
// Reutiliza entidades del Core cuando tiene sentido (ProductVariant)
// y define DTOs propios para información específica de la UI.
//
// ============================================================================

import type { ProductVariant } from "@/core/entities/Product";
import type { UUID, ISODateString, ProductType } from "@/core/entities/shared";

// ============================================================================
// AVISO DEL FORO
// ============================================================================

export interface AnnouncementDto {
  id: UUID;

  title: string;

  content: string;

  isPinned: boolean;

  createdAt: ISODateString;

  /**
   * Si el anuncio corresponde a una reunión,
   * el frontend podrá mostrar un botón para verla.
   */
  meetingId: UUID | null;
}

// ============================================================================
// VIDEO DE UN MÓDULO
// ============================================================================

export interface ModuleVideoDto {
  id: UUID;

  title: string;

  youtubeUrl: string;
}

// ============================================================================
// MÓDULO
// ============================================================================

export interface ModuleDto {
  id: UUID;

  title: string;

  description: string | null;

  /**
   * Orden del módulo dentro del curso.
   */
  order: number;

  progressPercentage: number;

  /**
   * Cada módulo puede tener un PDF.
   */
  pdfUrl: string | null;

  /**
   * Videos del módulo.
   */
  videos: ModuleVideoDto[];

  /**
   * Indica si el módulo posee una tarea entregable.
   */
  hasAssignment: boolean;
}

// ============================================================================
// PRODUCTO INCLUIDO (Programas)
// ============================================================================

export interface IncludedProductDto {
  id: UUID;

  name: string;

  slug: string;

  productType: ProductType;

  coverImageUrl: string | null;

  progressPercentage: number;

  isCompleted: boolean;
}

// ============================================================================
// INFORMACIÓN DEL ALUMNO SOBRE ESTE PRODUCTO
// ============================================================================

export interface ProductEnrollmentDto {
  /**
   * Fecha de vencimiento del acceso.
   */
  expiresAt: ISODateString;

  /**
   * Progreso general del producto.
   */
  progressPercentage: number;

  /**
   * Sólo aplica a Programas.
   *
   * Cursos y Talleres devolverán 0.
   */
  sessionsRemaining: number;
}

// ============================================================================
// OUTPUT PRINCIPAL
// ============================================================================

export interface GetProductDetailsOutput {
  /**
   * Producto completo del dominio.
   *
   * Puede ser:
   * - Course
   * - Workshop
   * - Program
   */
  product: ProductVariant;

  /**
   * Información específica de ESTA alumna
   * respecto a ESTE producto.
   */
  enrollment: ProductEnrollmentDto;

  /**
   * Foro interno del producto.
   */
  announcements: AnnouncementDto[];

  /**
   * Sólo los cursos poseen módulos.
   *
   * Talleres y Programas devolverán [].
   */
  modules: ModuleDto[];

  /**
   * Sólo los programas contienen productos.
   *
   * Cursos y Talleres devolverán [].
   */
  includedProducts: IncludedProductDto[];
}
