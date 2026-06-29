// ============================================================
// src/core/entities/Product.ts
//
// Entidades de dominio para los productos de la plataforma.
//
// La tabla base (products) contiene los datos compartidos por
// Cursos, Talleres y Programas.
//
// Cada tipo posee una tabla hija con sus propiedades exclusivas.
//
// La información concreta de cada producto (ej. Ave Fénix,
// Flor de Loto, Amor Propio, etc.) vive únicamente en Supabase.
// Este archivo solamente define la estructura del dominio.
// ============================================================

import type { UUID, ISODateString, ProductType } from "./shared";

// ============================================================
// TABLA BASE — products
// ============================================================

export interface Product {
  id: UUID;

  name: string;

  slug: string;

  description: string | null;

  shortDescription: string | null;

  price_usd: number;

  price_ars: number;

  productType: ProductType;

  coverImageUrl: string | null;

  /**
   * Video introductorio mostrado al ingresar al producto.
   */
  welcomeVideoUrl: string | null;

  /**
   * Indica si el producto incluye comunidad de WhatsApp.
   */
  hasWhatsappCommunity: boolean;

  isActive: boolean;

  createdAt: ISODateString;

  updatedAt: ISODateString;
}

//
// CURSOS
//

export interface CourseDetails {
  grantsCertificate: boolean;

  approvalMinScore: number;
}

export interface Course extends Product {
  productType: "course";

  courseDetails: CourseDetails;
}

//
// TALLERES
//

export interface WorkshopDetails {
  /**
   * PDF único del taller.
   */
  globalPdfUrl: string | null;
}

export interface Workshop extends Product {
  productType: "workshop";

  workshopDetails: WorkshopDetails;
}

//
// PROGRAMAS
//

export interface ProgramDetails {
  /**
   * Cantidad de sesiones individuales incluidas.
   */
  individualSessionsCount: number;

  /**
   * El programa entrega certificado propio.
   */
  grantsCertificate: boolean;

  /**
   * Nota mínima utilizada por los cursos que forman parte
   * del programa.
   */
  approvalMinScore: number;

  /**
   * Productos incluidos dentro del programa.
   *
   * Esta información proviene de la tabla
   * program_included_products.
   */
  includedProductIds: UUID[];
}

export interface Program extends Product {
  productType: "program";

  programDetails: ProgramDetails;
}

//
// Unión discriminada
//

export type ProductVariant = Course | Workshop | Program;

export const isCourse = (product: ProductVariant): product is Course =>
  product.productType === "course";

export const isWorkshop = (product: ProductVariant): product is Workshop =>
  product.productType === "workshop";

export const isProgram = (product: ProductVariant): product is Program =>
  product.productType === "program";

//
// Inputs de creación
//

export type CreateProductBaseInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt"
>;

export type CreateCourseInput = CreateProductBaseInput & {
  productType: "course";
  courseDetails: CourseDetails;
};

export type CreateWorkshopInput = CreateProductBaseInput & {
  productType: "workshop";
  workshopDetails: WorkshopDetails;
};

export type CreateProgramInput = CreateProductBaseInput & {
  productType: "program";
  programDetails: Omit<ProgramDetails, "includedProductIds">;

  /**
   * Productos que se insertarán luego en
   * program_included_products.
   */
  includedProductIds: UUID[];
};

export type CreateProductVariantInput =
  | CreateCourseInput
  | CreateWorkshopInput
  | CreateProgramInput;
