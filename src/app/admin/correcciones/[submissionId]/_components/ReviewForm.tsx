// ============================================================
// src/app/(admin)/correcciones/[submissionId]/_components/ReviewForm.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { reviewSubmissionAction } from "../../_actions/review-submission.action";
import type { UUID } from "@/core/entities/shared";

interface Props {
  submissionId: UUID;
  approvalMinScore: number;
}

export function ReviewForm({ submissionId, approvalMinScore }: Props) {
  const router = useRouter();
  const [score, setScore] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scoreNum = Number(score);
  const isValid =
    score !== "" &&
    Number.isInteger(scoreNum) &&
    scoreNum >= 1 &&
    scoreNum <= 100;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError("La nota debe ser un número entero entre 1 y 100.");
      return;
    }

    startTransition(async () => {
      const result = await reviewSubmissionAction({
        submissionId,
        feedbackText,
        score: scoreNum,
        approvalMinScore,
      });

      if (result.success) {
        router.push("/admin/correcciones");
      } else {
        setError(
          result.reason === "already_reviewed"
            ? "Esta entrega ya fue corregida."
            : "La nota debe ser un número entero entre 1 y 100.",
        );
      }
    });
  }

  const willApprove = isValid && scoreNum >= approvalMinScore;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-white/10 bg-guarida-dark-violet p-5"
    >
      <div>
        <label htmlFor="score" className="text-sm font-medium text-white">
          Nota (1-100)
        </label>
        <input
          id="score"
          type="number"
          min={1}
          max={100}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          disabled={isPending}
          className="mt-2 w-32 rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-white focus:border-guarida-violet/50 focus:outline-none"
        />
        {isValid && (
          <span
            className={`ml-3 text-xs ${willApprove ? "text-guarida-sky" : "text-red-400"}`}
          >
            {willApprove
              ? "Se aprobará"
              : `Se rechazará (mínimo ${approvalMinScore})`}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="feedback" className="text-sm font-medium text-white">
          Devolución (opcional)
        </label>
        <textarea
          id="feedback"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          disabled={isPending}
          rows={6}
          placeholder="Comentarios para la alumna..."
          className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-white/25 focus:border-guarida-violet/50 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="flex w-fit items-center gap-2 rounded-lg bg-guarida-violet px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Enviar corrección
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
