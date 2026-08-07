// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/SessionCard.tsx
//
// Card de sesiones individuales.
//
// Responsabilidad:
//
// • Mostrar cuántas sesiones quedan.
// • Mostrar CTA para Cal.com.
//
// No conoce:
//
// • Program
// • Enrollment
// • Supabase
// ============================================================

import { CalendarDays, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { BaseActionCard } from "@/app/(dashboard)/aula-virtual/[slug]/_components/shared/BaseActionCard";

interface SessionCardProps {
  remainingSessions: number;
  totalSessions: number;

  /**
   * URL pública de Cal.com.
   * Si no existe, el botón queda deshabilitado.
   */
  bookingUrl?: string;
}

export function SessionCard({
  remainingSessions,
  totalSessions,
  bookingUrl,
}: SessionCardProps) {
  const hasSessionsLeft = remainingSessions > 0;

  return (
    <BaseActionCard
      className="bg-guarida-fuchsia/20"
      title="Sesiones individuales"
      icon={<CalendarDays className="h-5 w-5 text-guarida-fuchsia" />}
      footer={
        <SessionCardFooter
          className="bg-guarida-fuchsia/20"
          bookingUrl={bookingUrl}
          hasSessionsLeft={hasSessionsLeft}
        />
      }
    >
      <p className="mt-3 text-xs uppercase tracking-wide text-white/40">
        Disponibles
      </p>

      <div className="mt-2 flex items-end gap-2">
        <span className="text-4xl font-bold leading-none">
          {remainingSessions}
        </span>

        <span className="pb-1 text-sm text-white/50">/ {totalSessions}</span>
      </div>

      {!hasSessionsLeft && (
        <p className="mt-4 text-sm text-white/40">
          Ya utilizaste todas las sesiones incluidas en este programa.
        </p>
      )}
    </BaseActionCard>
  );
}

interface SessionCardFooterProps {
  className?: string;
  bookingUrl?: string;
  hasSessionsLeft: boolean;
}

function SessionCardFooter({
  className,
  bookingUrl,
  hasSessionsLeft,
}: SessionCardFooterProps) {
  if (!bookingUrl) {
    return (
      <button
        disabled
        className={clsx(
          "flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white/30",
          className,
        )}
      >
        Agendar sesión
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <a
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!hasSessionsLeft}
      onClick={(e) => {
        if (!hasSessionsLeft) {
          e.preventDefault();
        }
      }}
      className={[
        "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-opacity",

        hasSessionsLeft
          ? "bg-guarida-fuchsia/20 text-guarida-fuchsia hover:opacity-80"
          : "cursor-not-allowed bg-white/5 text-white/30",
      ].join(" ")}
    >
      Agendar sesión
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
