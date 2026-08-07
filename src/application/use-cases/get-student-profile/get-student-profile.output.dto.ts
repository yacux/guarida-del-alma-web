// ============================================================================
// src/application/use-cases/get-profile/get-profile.output.dto.ts
//
// Output del caso de uso.
//
// Este DTO desacopla la UI de la entidad Profile.
// Si mañana Profile cambia, la página no se rompe.
// ============================================================================

export interface GetProfileOutputDto {
  id: string;

  email: string;

  username: string | null;

  avatarUrl: string | null;

  role: "student" | "admin";

  createdAt: string;

  updatedAt: string;
}
