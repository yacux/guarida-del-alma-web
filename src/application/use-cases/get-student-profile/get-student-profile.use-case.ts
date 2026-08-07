// ============================================================================
// src/application/use-cases/get-profile/GetProfileUseCase.ts
//
// RESPONSABILIDAD
// ----------------
// Recupera el perfil del usuario autenticado.
//
// Este caso de uso:
//
// 1. Busca el perfil mediante el repositorio.
// 2. Lanza error si no existe.
// 3. Devuelve un DTO listo para la capa de presentación.
//
// No conoce Supabase.
// No conoce Clerk.
// Solo depende del contrato IProfileRepository.
// ============================================================================

import type { IProfileRepository } from "@/core/repositories";

import type { GetProfileInputDto } from "./get-student-profile.input.dto";
import type { GetProfileOutputDto } from "./get-student-profile.output.dto";

export class GetStudentProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(input: GetProfileInputDto): Promise<GetProfileOutputDto> {
    const profile = await this.profileRepository.findById(input.userId);

    if (!profile) {
      throw new Error("Perfil no encontrado.");
    }

    return {
      id: profile.id,

      email: profile.email,

      username: profile.username,

      avatarUrl: profile.avatarUrl,

      role: profile.role,

      createdAt: profile.createdAt,

      updatedAt: profile.updatedAt,
    };
  }
}
