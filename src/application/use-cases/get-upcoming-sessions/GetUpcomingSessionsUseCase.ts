// ============================================================
// src/application/use-cases/get-upcoming-sessions/GetUpcomingSessionsUseCase.ts
// ============================================================

import type { IStudentSessionsRepository } from "@/core/repositories/IStudentSessionsRepository";
import type { GetUpcomingSessionsInputDTO } from "./GetUpcomingSessionsUseCase.input.dto";
import type { UpcomingSessionDTO } from "./GetUpcomingSessionsUseCase.output.dto";

export class GetUpcomingSessionsUseCase {
  constructor(
    private readonly sessionsRepository: IStudentSessionsRepository,
  ) {}

  async execute(
    input: GetUpcomingSessionsInputDTO,
  ): Promise<UpcomingSessionDTO[]> {
    const sessions = await this.sessionsRepository.getUpcomingSessions({
      enrollmentId: input.enrollmentId,
    });

    return sessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt.toISOString(),
      durationMinutes: s.durationMinutes,
    }));
  }
}
