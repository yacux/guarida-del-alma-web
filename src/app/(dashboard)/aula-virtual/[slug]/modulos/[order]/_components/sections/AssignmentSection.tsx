// ============================================================
// src/app/(dashboard)/aula-virtual/_components/module/sections/AssignmentSection.tsx
//
// Muestra la tarea del módulo, la última entrega y el feedback.
// Es puramente de lectura — el formulario llega por formSlot,
// decidido por ModulePage según canSubmit (no se construye acá).
// ============================================================

import type {
  ModuleSubmission,
  ModuleSubmissionFeedback,
} from "@/core/entities/Submission";
import type { ModuleAssignment } from "@/core/entities/Module";
import type { SubmissionStatus } from "@/core/entities/shared";
import { CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";

const SUBMISSION_STATUS_CONFIG: Record<
  SubmissionStatus,
  {
    label: string;
    description: string | null;
    borderClass: string;
    textClass: string;
    bgClass: string;
    Icon: React.ElementType;
  }
> = {
  pending_review: {
    label: "En revisión",
    description:
      "Hebe está revisando tu entrega. Te notificaremos cuando esté lista.",
    borderClass: "border-amber-500/20",
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    Icon: Clock,
  },
  approved: {
    label: "Aprobada",
    description: null,
    borderClass: "border-guarida-sky/20",
    textClass: "text-guarida-sky",
    bgClass: "bg-guarida-sky/10",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Rechazada",
    description: "Podés revisar el feedback de Hebe y volver a entregar.",
    borderClass: "border-red-500/20",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    Icon: XCircle,
  },
  recovery_pending: {
    label: "Recuperación en revisión",
    description: "Hebe está revisando tu re-entrega.",
    borderClass: "border-orange-500/20",
    textClass: "text-orange-400",
    bgClass: "bg-orange-500/10",
    Icon: RotateCcw,
  },
};

interface AssignmentSectionProps {
  assignment: ModuleAssignment | null;
  latestSubmission: ModuleSubmission | null;
  feedback: ModuleSubmissionFeedback | null;
  canSubmit: boolean;
  /** Inyectado por ModulePage cuando canSubmit=true. */
  formSlot?: React.ReactNode;
}

export function AssignmentSection({
  assignment,
  latestSubmission,
  feedback,
  canSubmit,
  formSlot,
}: AssignmentSectionProps) {
  if (!assignment) return null;

  const statusConfig = latestSubmission
    ? SUBMISSION_STATUS_CONFIG[latestSubmission.status]
    : null;

  {
    console.log("el can submit essss: " + canSubmit);
  }

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-white">{assignment.title}</h2>

      {latestSubmission && statusConfig && (
        <div
          className={`rounded-xl border p-4 ${statusConfig.bgClass} ${statusConfig.borderClass}`}
        >
          <div className="flex items-center gap-2">
            <statusConfig.Icon
              className={`h-4 w-4 ${statusConfig.textClass}`}
            />
            <span className={`text-sm font-semibold ${statusConfig.textClass}`}>
              {statusConfig.label}
              {latestSubmission.attemptNumber > 1 && (
                <span className="ml-1 font-normal opacity-70">
                  (intento {latestSubmission.attemptNumber})
                </span>
              )}
            </span>
          </div>
          {statusConfig.description && (
            <p className="mt-1 pl-6 text-xs text-white/40">
              {statusConfig.description}
            </p>
          )}
        </div>
      )}

      {latestSubmission && (
        <div className="rounded-xl border border-white/5 bg-guarida-dark-violet p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">
            Tu última entrega
          </h3>
          {latestSubmission.answers.map((answer, index) => (
            <p key={index} className="text-sm text-white/70 leading-relaxed">
              {answer}
            </p>
          ))}
        </div>
      )}

      {feedback && (
        <div className="flex flex-col gap-3 rounded-xl border border-guarida-violet/20 bg-guarida-dark-violet p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Devolución de Hebe
            </h3>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">
                {feedback.score}
              </span>
              <span className="text-xs text-white/30">/ 100</span>
            </div>
          </div>
          {feedback.feedbackText && (
            <p className="text-sm leading-relaxed text-white/60">
              {feedback.feedbackText}
            </p>
          )}
        </div>
      )}

      {/* Formulario real de entrega, decidido por ModulePage */}
      {canSubmit && formSlot}
    </section>
  );
}
