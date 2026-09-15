// ============================================================
// src/application/use-cases/get-pending-submissions/GetPendingSubmissionsUseCase.ts
//
// Sin input: siempre devuelve TODA la cola de corrección.
// La autorización de "solo admin puede ver esto" la resuelve
// RLS (assignment_submissions: ver propias o admin) — el use
// case confía en que el cliente inyectado ya está autenticado
// como admin (verificado antes en middleware + RBAC de la ruta).
// ============================================================

import type { ISubmissionRepository } from "@/core/repositories/ISubmissionRepository";
import type { GetPendingSubmissionsOutput } from "./GetPendingSubmissionsUseCase.output.dto";

export class GetPendingSubmissionsUseCase {
  constructor(private readonly submissionRepository: ISubmissionRepository) {}

  async execute(): Promise<GetPendingSubmissionsOutput> {
    const items = await this.submissionRepository.findAllPendingReview();
    return { items };
  }
}
