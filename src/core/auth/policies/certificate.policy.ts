// core/auth/policies/certificate.policy.ts

import type { ModuleProgress } from "@/core/entities/StudentProgress";
import type { FinalActivitySubmission } from "@/core/entities/Submission";

/**
 * ¿Puede descargar el certificado?
 * Requiere: todos los módulos completados + actividad final aprobada.
 */
// ✅ canDownloadCertificate — completamente fuera del alcance de RLS
// RLS no sabe nada del estado de completitud de módulos.
// Esta es 100% lógica de dominio que vive en TypeScript.
export function canDownloadCertificate(
  progresses: ModuleProgress[],
  finalSubmission: FinalActivitySubmission | null,
): boolean {
  return (
    progresses.length > 0 &&
    progresses.every((p) => p.completedAt !== null) &&
    finalSubmission?.status === "approved"
  );
}
