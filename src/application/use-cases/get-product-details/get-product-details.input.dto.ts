// ============================================================
// src/application/use-cases/get-product-details/get-product-details.input.ts
//
// Datos mínimos necesarios para abrir una formación.
//
// productSlug:
//   Identifica qué curso/taller/programa quiere abrir.
//
// studentId:
//   Permite validar acceso y cargar progreso.
// ============================================================

import type { ClerkUserId } from "@/core/entities/shared";

export interface GetProductDetailsInput {
  productSlug: string;
  studentId: ClerkUserId;
}
