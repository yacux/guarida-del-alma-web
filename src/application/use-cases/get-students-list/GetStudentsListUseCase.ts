// ============================================================
// src/application/use-cases/get-students-list/GetStudentsListUseCase.ts
// ============================================================
import type { IProfileRepository } from "@/core/repositories/IProfileRepository";
import type { Profile } from "@/core/entities/Profile";

export class GetStudentsListUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(): Promise<Profile[]> {
    return this.profileRepository.findAllStudents();
  }
}
