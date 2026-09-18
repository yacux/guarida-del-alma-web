// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/LiveSessionCard.tsx
//
// Card de próxima sesión en vivo.
//
// Responsabilidad:
//
// • Mostrar la próxima sesión en vivo.
// • Mostrar CTA hacia el contenido correspondiente.
//
// No conoce:
//
// • Program
// • Supabase
// • Use Cases
// ============================================================

import { ArrowRight, Video } from "lucide-react";

import { BaseActionCard } from "@/app/(dashboard)/aula-virtual/[slug]/_components/shared/BaseActionCard";

interface LiveSessionCardProps {
  upcomingLive?: {
    productName: string;
    productType: "workshop" | "course" | "program";
    startsAt: string;
    href: string;
  };
}

const PRODUCT_TYPE_LABEL = {
  workshop: "Taller",
  course: "Curso",
  program: "Programa",
} as const;

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string) {
  return (
    new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " hs"
  );
}

export function LiveSessionCard({ upcomingLive }: LiveSessionCardProps) {
  return (
    <BaseActionCard
      title="Sesiones Grupales"
      className="bg-guarida-dark-violet"
      icon={<Video className="h-5 w-5 text-guarida-sky" />}
      footer={<LiveSessionFooter upcomingLive={upcomingLive} />}
    >
      {upcomingLive ? (
        <>
          <span className="mt-4 inline-flex w-fit rounded-full bg-guarida-violet/60 px-2.5 py-0.5 text-xs font-medium text-white/90">
            {PRODUCT_TYPE_LABEL[upcomingLive.productType]}{" "}
            {upcomingLive.productName}
          </span>

          <p className="mt-4 text-sm font-semibold capitalize">
            {formatDay(upcomingLive.startsAt)}
          </p>

          <p className="text-sm text-white/60">
            {formatTime(upcomingLive.startsAt)} (Argentina)
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-white/40">
          No hay sesiones programadas próximamente.
        </p>
      )}
    </BaseActionCard>
  );
}

interface LiveSessionFooterProps {
  upcomingLive?: LiveSessionCardProps["upcomingLive"];
}

function LiveSessionFooter({ upcomingLive }: LiveSessionFooterProps) {
  if (!upcomingLive) {
    return (
      <button
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center bg-white/5 gap-2 rounded-xl py-2.5 text-sm font-medium text-white/30"
      >
        Sin sesiones próximas
      </button>
    );
  }

  return (
    <a
      href={upcomingLive.href}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-guarida-sky/30 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
    >
      Ir al contenido
      <ArrowRight className="h-3.5 w-3.5" />
    </a>
  );
}
