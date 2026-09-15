// ============================================================
// src/application/use-cases/get-workshop-page/GetWorkshopPageUseCase.input.dto.ts
// ============================================================
import type { ClerkUserId } from "@/core/entities/shared";

export interface GetWorkshopPageInput {
  workshopSlug: string;
  studentId: ClerkUserId;
}
