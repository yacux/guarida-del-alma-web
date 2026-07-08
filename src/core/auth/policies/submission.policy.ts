// src/core/auth/policies/submission.policy.ts

import type {
  ModuleSubmission,
  FinalActivitySubmission,
} from "@/core/entities/Submission";

type AnySubmission = ModuleSubmission | FinalActivitySubmission;

/**
 * ¿Puede la alumna re-entregar?
 * Solo si su última entrega fue rechazada.
 * Antes vivía en Submission.ts como helper de entidad,
 * pero responde una pregunta de autorización → va en policy.
 */
export function canResubmit(latest: AnySubmission): boolean {
  return latest.status === "failed";
}

/**
 * ¿Está esperando corrección de Hebe?
 * Renombrado de isPendingReview → needsReview por consistencia
 * con el resto de las policies (verbos afirmativos).
 */
export function needsReview(submission: AnySubmission): boolean {
  return (
    submission.status === "pending_review" ||
    submission.status === "recovery_pending"
  );
}
