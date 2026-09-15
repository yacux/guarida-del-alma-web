// ============================================================
// src/application/use-cases/get-session-balance/GetSessionBalanceUseCase.ts
// ============================================================

import type { IStudentSessionsRepository } from "@/core/repositories/IStudentSessionsRepository";
import type { GetSessionBalanceInputDTO } from "./GetSessionBalanceUseCase.input.dto";
import type { GetSessionBalanceOutputDTO } from "./GetSessionBalanceUseCase.output.dto";

export class GetSessionBalanceUseCase {
  constructor(
    private readonly sessionsRepository: IStudentSessionsRepository,
  ) {}

  async execute(
    input: GetSessionBalanceInputDTO,
  ): Promise<GetSessionBalanceOutputDTO> {
    const balance = await this.sessionsRepository.getSessionBalance({
      studentId: input.studentId,
      productId: input.productId,
    });

    if (!balance) {
      return {
        enrollmentId: null,
        sessionsIncluded: 0,
        sessionsUsed: 0,
        sessionsRemaining: 0,
      };
    }

    return {
      enrollmentId: balance.enrollmentId,
      sessionsIncluded: balance.sessionsIncluded,
      sessionsUsed: balance.sessionsUsed,
      sessionsRemaining: balance.sessionsRemaining,
    };
  }
}
