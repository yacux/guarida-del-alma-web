// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/SessionCard.tsx
//
// Card de sesiones individuales.
//
// Responsabilidad:
//
// • Mostrar cuántas sesiones quedan.
// • Mostrar la próxima sesión agendada (si hay).
// • Abrir el modal de reserva embebido.
//
// No conoce:
//
// • Program
// • Enrollment
// • Supabase
// ============================================================

"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { BaseActionCard } from "@/app/(dashboard)/aula-virtual/[slug]/_components/shared/BaseActionCard";
import { Modal } from "@/app/(dashboard)/aula-virtual/[slug]/_components/shared/Modal";
import { BookingModal } from "@/app/(dashboard)/aula-virtual/[slug]/_components/program/IndividualSessions/BookingModal";

export interface UpcomingSessionItem {
  id: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
}

interface SessionCardProps {
  remainingSessions: number;
  totalSessions: number;
  upcomingSessions?: UpcomingSessionItem[];
  /** Necesarios para reservar. Si faltan, el botón queda deshabilitado. */
  productId?: string;
  slug?: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const dateFormatterLong = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function SessionCard({
  remainingSessions,
  totalSessions,
  upcomingSessions = [],
  productId,
  slug,
}: SessionCardProps) {
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const hasSessionsLeft = remainingSessions > 0;
  const canBook = hasSessionsLeft && Boolean(productId && slug);
  const [nextSession, ...restSessions] = upcomingSessions;

  return (
    <>
      <BaseActionCard
        className="bg-guarida-fuchsia/20"
        title="Sesiones Individuales"
        icon={<CalendarDays className="h-5 w-5 text-guarida-fuchsia" />}
        footer={
          <button
            disabled={!canBook}
            onClick={() => setShowBooking(true)}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-opacity",
              canBook
                ? "bg-guarida-fuchsia/20 text-white/80 hover:opacity-80"
                : "cursor-not-allowed bg-white/5 text-white/30",
            ].join(" ")}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Agendar sesión
          </button>
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

        {!hasSessionsLeft && upcomingSessions.length === 0 && (
          <p className="mt-4 text-sm text-white/40">
            Ya utilizaste todas las sesiones incluidas en este programa.
          </p>
        )}

        {nextSession && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/40">
              Próxima sesión
            </p>
            <p className="mt-0.5 truncate text-sm font-medium capitalize text-white">
              {dateFormatter.format(new Date(nextSession.scheduledAt))} ·{" "}
              {timeFormatter.format(new Date(nextSession.scheduledAt))} hs
            </p>
            {restSessions.length > 0 && (
              <button
                onClick={() => setShowAllSessions(true)}
                className="mt-1 text-xs font-medium text-guarida-fuchsia hover:underline"
              >
                + {restSessions.length} más agendada
                {restSessions.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}
      </BaseActionCard>

      <Modal
        open={showAllSessions}
        onClose={() => setShowAllSessions(false)}
        title="Tus sesiones agendadas"
      >
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {upcomingSessions.map((session) => (
            <li
              key={session.id}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <p className="text-sm font-medium capitalize text-white">
                {dateFormatterLong.format(new Date(session.scheduledAt))}
              </p>
              <p className="text-xs text-white/50">
                {timeFormatter.format(new Date(session.scheduledAt))} hs ·{" "}
                {session.durationMinutes} min
              </p>
            </li>
          ))}
        </ul>
      </Modal>

      {productId && slug && (
        <BookingModal
          open={showBooking}
          onClose={() => setShowBooking(false)}
          productId={productId}
          slug={slug}
        />
      )}
    </>
  );
}
