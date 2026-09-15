// ============================================================
// src/app/(dashboard)/aula-virtual/[slug]/_components/program/IndividualSessions/BookingModal.tsx
//
// Selector de fecha + horarios embebido. Reemplaza el link
// externo a Cal.com por una experiencia propia de Guarida.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "../../shared/Modal";
import {
  fetchAvailableSlots,
  bookSession,
} from "../../../_actions/sessionActions";
import type { AvailableDayDTO } from "@/application/use-cases/get-available-slots/GetAvailableSlotsUseCase.output.dto";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  slug: string;
}

const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function BookingModal({
  open,
  onClose,
  productId,
  slug,
}: BookingModalProps) {
  const [days, setDays] = useState<AvailableDayDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Cargamos slots solo al abrir el modal, no en cada render de la página.
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);

    const toISODate = (d: Date) => d.toISOString().split("T")[0];

    fetchAvailableSlots({
      startDate: toISODate(today),
      endDate: toISODate(in30Days),
      timeZone,
    })
      .then((result) => {
        setDays(result);
        setSelectedDate(result[0]?.date ?? null);
      })
      .catch(() => setError("No pudimos cargar los horarios disponibles."))
      .finally(() => setLoading(false));
  }, [open, timeZone]);

  async function handleBook(start: string) {
    setBooking(true);
    setError(null);

    const result = await bookSession({ productId, slug, start, timeZone });

    setBooking(false);

    if (result.outcome === "created") {
      setConfirmed(true);
      return;
    }
    if (result.outcome === "no_sessions_available") {
      setError("Ya no te quedan sesiones disponibles en este programa.");
      return;
    }
    setError(
      "No pudimos confirmar la reserva. Intentá de nuevo en unos minutos.",
    );
  }

  function handleClose() {
    setConfirmed(false);
    setError(null);
    onClose();
  }

  const slotsOfSelectedDay =
    days.find((d) => d.date === selectedDate)?.slots ?? [];

  return (
    <Modal open={open} onClose={handleClose} title="Reservar sesión individual">
      {confirmed ? (
        <div className="py-4 text-center">
          <p className="text-sm text-white">¡Tu sesión quedó reservada!</p>
          <p className="mt-1 text-xs text-white/50">
            Vas a recibir un email con el enlace de Google Meet.
          </p>
          <button
            onClick={handleClose}
            className="mt-4 w-full rounded-xl bg-guarida-fuchsia/20 py-2.5 text-sm font-medium text-guarida-fuchsia"
          >
            Cerrar
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Buscando horarios…</span>
        </div>
      ) : days.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/50">
          No hay horarios disponibles en los próximos 30 días.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
            Elegí un día
          </p>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {days.map((day) => (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={[
                  "shrink-0 rounded-lg border px-3 py-2 text-xs capitalize transition-colors",
                  day.date === selectedDate
                    ? "border-guarida-fuchsia bg-guarida-fuchsia/20 text-guarida-fuchsia"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                ].join(" ")}
              >
                {dayFormatter.format(new Date(`${day.date}T12:00:00`))}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
            Horarios disponibles
          </p>
          <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto">
            {slotsOfSelectedDay.map((slot) => (
              <button
                key={slot}
                disabled={booking}
                onClick={() => handleBook(slot)}
                className="rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-white transition-colors hover:border-guarida-fuchsia hover:text-guarida-fuchsia disabled:opacity-40"
              >
                {timeFormatter.format(new Date(slot))}
              </button>
            ))}
          </div>

          {booking && (
            <p className="mt-3 flex items-center gap-2 text-xs text-white/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              Confirmando tu reserva…
            </p>
          )}
        </>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </Modal>
  );
}
