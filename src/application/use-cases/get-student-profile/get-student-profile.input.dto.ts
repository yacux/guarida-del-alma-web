// ============================================================================
// src/application/use-cases/get-profile/get-profile.input.dto.ts
//
// Input del caso de uso GetProfileUseCase.
//
// Recibe el Clerk User ID del usuario autenticado.
// ============================================================================

import type { ClerkUserId } from "@/core/entities/shared";

export interface GetProfileInputDto {
  userId: ClerkUserId;
}
