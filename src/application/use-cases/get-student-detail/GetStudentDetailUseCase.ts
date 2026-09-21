// ============================================================
// src/application/use-cases/get-student-detail/GetStudentDetailUseCase.ts
//
// Nota: usa IEnrollmentRepository.findActiveByStudentId — si tu
// interfaz todavía no tiene ese método, es análogo a
// findActiveByStudentAndProduct que ya existe, sin el filtro de producto.
// ============================================================
import type { IProfileRepository } from "@/core/repositories/IProfileRepository";
import type { IEnrollmentRepository } from "@/core/repositories/IEnrollmentRepository";
import type { Profile } from "@/core/entities/Profile";
import type { Enrollment } from "@/core/entities/Enrollment";
import type { ClerkUserId } from "@/core/entities/shared";

export interface GetStudentDetailOutput {
  profile: Profile;
  enrollments: Enrollment[];
}

export class GetStudentDetailUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(
    studentId: ClerkUserId,
  ): Promise<GetStudentDetailOutput | null> {
    const profile = await this.profileRepository.findById(studentId);
    if (!profile) return null;

    const enrollments =
      await this.enrollmentRepository.findActiveByStudentId(studentId);
    return { profile, enrollments };
  }
}
