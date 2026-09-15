// ============================================================
// src/app/(dashboard)/aula-virtual/[slug]/_components/program/IndividualSessions/UpcomingSessions.tsx
//
// Lista de próximas sesiones individuales confirmadas.
//
// Responsabilidad:
//
// • Mostrar fecha y hora de cada sesión agendada.
// • Mostrar estado vacío cuando no hay sesiones próximas.
//
// No conoce:
//
// • Program
// • Enrollment
// • Supabase
// ============================================================

import { CalendarClock } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";

export interface UpcomingSessionItem {
  id: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
}

interface UpcomingSessionsProps {
  sessions: UpcomingSessionItem[];
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No tenés sesiones agendadas"
        description="Cuando reserves una sesión individual, la vas a ver acá."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => {
        const date = new Date(session.scheduledAt);

        return (
          <li
            key={session.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-guarida-fuchsia/20 text-guarida-fuchsia">
              <CalendarClock className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="truncate font-medium capitalize text-white">
                {dateFormatter.format(date)}
              </p>
              <p className="text-sm text-white/50">
                {timeFormatter.format(date)} hs · {session.durationMinutes} min
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
