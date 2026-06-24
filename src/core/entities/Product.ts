// ============================================================
// src/core/entities/Product.ts
// v3: access_duration_months, welcome_video_url y
//     has_whatsapp_community subieron a la entidad base Product
//     porque aplican universalmente a los 3 tipos de producto.
//
// Tablas hijas solo guardan lo EXCLUSIVO de cada tipo:
//   • Course   → grantsCertificate, approvalMinScore
//   • Workshop → globalPdfUrl
//   • Program  → individualSessionsCount, grantsCertificate, approvalMinScore
// ============================================================

import type { UUID, ISODateString, ProductType } from "./shared";

// ——————————————————————————————————————————————
// TABLA BASE — public.products
// ——————————————————————————————————————————————
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
  /** Universal: video introductorio / bienvenida */
  welcomeVideoUrl: string | null;
  /** Universal: si incluye comunidad de WhatsApp */
  hasWhatsappCommunity: boolean;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ——————————————————————————————————————————————
// ESPECIALIZACIÓN: CURSO — public.product_courses
// Exclusivo: certificado y nota mínima de aprobación.
// ——————————————————————————————————————————————
export interface CourseDetails {
  grantsCertificate: boolean;
  /** Nota mínima (1-100) para aprobar tareas y actividad final */
  approvalMinScore: number;
}

export interface Course extends Product {
  productType: "course";
  courseDetails: CourseDetails;
}

// ——————————————————————————————————————————————
// ESPECIALIZACIÓN: TALLER — public.product_workshops
// Exclusivo: el PDF global de contenido.
// ——————————————————————————————————————————————
export interface WorkshopDetails {
  /** El único PDF de contenido del taller */
  globalPdfUrl: string | null;
}

export interface Workshop extends Product {
  productType: "workshop";
  workshopDetails: WorkshopDetails;
}

// ——————————————————————————————————————————————
// ESPECIALIZACIÓN: PROGRAMA — public.product_programs
// Exclusivo: sesiones 1-on-1, certificado, nota mínima.
// ——————————————————————————————————————————————
export interface ProgramDetails {
  /** Sesiones 1-on-1 incluidas: 12 (Ave Fénix) o 6 (Flor de Loto) */
  individualSessionsCount: number;
  grantsCertificate: boolean;
  /** Nota mínima para los cursos incluidos en el programa */
  approvalMinScore: number;
  /**
   * IDs de los productos incluidos en este programa.
   * Refleja program_included_products.
   * La duración del PROGRAMA prevalece para todos estos accesos.
   */
  includedProductIds: UUID[];
}

export interface Program extends Product {
  productType: "program";
  programDetails: ProgramDetails;
}

// ——————————————————————————————————————————————
// UNIÓN DISCRIMINADA + TYPE GUARDS
// ——————————————————————————————————————————————
export type ProductVariant = Course | Workshop | Program;

export const isCourse = (p: ProductVariant): p is Course =>
  p.productType === "course";
export const isWorkshop = (p: ProductVariant): p is Workshop =>
  p.productType === "workshop";
export const isProgram = (p: ProductVariant): p is Program =>
  p.productType === "program";

// ——————————————————————————————————————————————
// INPUTS DE CREACIÓN
// ——————————————————————————————————————————————
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
  includedProductIds: UUID[];
};

export type CreateProductVariantInput =
  | CreateCourseInput
  | CreateWorkshopInput
  | CreateProgramInput;
