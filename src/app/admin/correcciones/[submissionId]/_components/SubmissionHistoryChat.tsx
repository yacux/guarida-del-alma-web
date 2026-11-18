// ============================================================
// src/app/admin/correcciones/[submissionId]/_components/SubmissionHistoryChat.tsx
// ============================================================

import type { SubmissionHistoryEntry } from "@/application/use-cases/get-submission-history/GetSubmissionHistoryUseCase";

interface Props {
  history: SubmissionHistoryEntry[];
}

export function SubmissionHistoryChat({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-white/50">
        Historial ({history.length}{" "}
        {history.length === 1 ? "intento" : "intentos"})
      </h2>

      {history.map(({ submission, feedback }) => (
        <div key={submission.id} className="flex flex-col gap-2">
          {/* Burbuja de la alumna — entrega */}
          <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm border border-white/5 bg-guarida-dark-violet p-4">
            <p className="mb-1 text-xs font-medium text-white/40">
              Intento {submission.attemptNumber}
            </p>
            {submission.answers.map((answer, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap"
              >
                {answer}
              </p>
            ))}
          </div>

          {/* Burbuja de Hebe — corrección, si existe */}
          {feedback ? (
            <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm border border-guarida-violet/20 bg-guarida-violet/10 p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium text-white/40">Hebe</p>
                <span
                  className={`text-sm font-bold ${feedback.isApproved ? "text-guarida-sky" : "text-red-400"}`}
                >
                  {feedback.score}/100
                </span>
              </div>
              {feedback.feedbackText && (
                <p className="text-sm leading-relaxed text-white/80">
                  {feedback.feedbackText}
                </p>
              )}
              <p className="mt-2 text-xs text-white/30">
                {feedback.isApproved ? "✓ Aprobada" : "✗ Rechazada"}
              </p>
            </div>
          ) : (
            <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm border border-amber-500/20 bg-amber-500/5 px-4 py-2">
              <p className="text-xs text-amber-400">Esperando corrección...</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
