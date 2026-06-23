// ============================================================
// src/application/use-cases/get-student-dashboard/studentDashboardDto.ts
//
// DTO de salida del dashboard.
//
// Este objeto representa una tarjeta visual dentro del aula.
// El frontend no necesita conocer Enrollment ni Product.
// Solo necesita información lista para renderizar.
// ============================================================

import type { UUID, ISODateString, ProductType } from "@/core/entities/shared";

export interface StudentDashboardItem {
  productId: UUID;
  name: string;
  slug: string;
  productType: ProductType;
  coverImageUrl: string | null;
  progressPercentage: number;
  expiresAt: ISODateString;
  isExpired: boolean;
}
