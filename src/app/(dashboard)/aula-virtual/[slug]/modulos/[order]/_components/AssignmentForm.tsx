// ============================================================
// src/app/(dashboard)/aula-virtual/[slug]/modulos/[order]/_components/AssignmentForm.tsx
//
// Client Component — formulario de entrega.
// Un solo textarea de respuesta libre (la consigna está en el PDF).
// Llama a la Server Action, sin lógica de negocio propia.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { submitAssignmentAction } from "../_actions/submit-assignment.action";
import type { UUID } from "@/core/entities/shared";

interface AssignmentFormProps {
  assignmentId: UUID;
  moduleId: UUID;
  enrollmentId: UUID;
  courseSlug: string;
  moduleOrder: number;
  /** true si es una re-entrega (última fue rechazada) */
  isRecovery: boolean;
}

const MIN_LENGTH = 20;

export function AssignmentForm({
  assignmentId,
  moduleId,
  enrollmentId,
  courseSlug,
  moduleOrder,
  isRecovery,
}: AssignmentFormProps) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const trimmedLength = answer.trim().length;
  const isValid = trimmedLength >= MIN_LENGTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError(`Tu respuesta necesita al menos ${MIN_LENGTH} caracteres.`);
      return;
    }

    startTransition(async () => {
      const result = await submitAssignmentAction({
        assignmentId,
        moduleId,
        enrollmentId,
        answer: answer.trim(),
        courseSlug,
        moduleOrder,
      });

      if (result.success) {
        setSuccess(true);
        setAnswer("");
      } else {
        setError(mapErrorReason(result.reason));
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-xl border border-guarida-sky/20 bg-guarida-sky/10 p-5 text-center">
        <p className="text-sm font-medium text-guarida-sky">
          ¡Tu entrega fue enviada!
        </p>
        <p className="mt-1 text-xs text-white/50">
          Hebe la va a revisar pronto. Te vamos a avisar cuando tengas la
          devolución.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-guarida-dark-violet p-5"
    >
      <label
        htmlFor="assignment-answer"
        className="text-sm font-medium text-white"
      >
        {isRecovery ? "Volvé a entregar tu trabajo" : "Entregá tu trabajo"}
      </label>

      <p className="text-sm text-white/80">
        Escribí tu reflexión o desarrollo según la consigna del PDF del módulo.
      </p>

      <textarea
        id="assignment-answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={isPending}
        rows={8}
        placeholder="Escribí acá tu respuesta..."
        className="font-serif w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder:text-white/25 focus:border-guarida-violet/50 focus:outline-none disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            isValid ? "text-white/30" : "text-amber-400/70"
          }`}
        >
          {trimmedLength} / {MIN_LENGTH} caracteres mínimos
        </span>

        <button
          type="submit"
          disabled={isPending || !isValid}
          className="flex items-center gap-2 rounded-lg bg-guarida-violet px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {isRecovery ? "Reenviar" : "Entregar"}
            </>
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

function mapErrorReason(reason: string): string {
  switch (reason) {
    case "module_locked":
      return "Este módulo todavía no está disponible para vos.";
    case "cannot_resubmit":
      return "Ya tenés una entrega aprobada o en revisión para este módulo.";
    case "empty_answer":
      return "Tu respuesta no puede estar vacía.";
    case "assignment_not_found":
      return "No se encontró la tarea de este módulo.";
    default:
      return "Ocurrió un error al enviar tu entrega. Intentá de nuevo.";
  }
}
