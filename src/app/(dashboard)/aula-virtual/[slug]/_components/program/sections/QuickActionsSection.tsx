// ============================================================
// src/app/(dashboard)/aula-virtual/components/program/sections/QuickActionsSection.tsx
//
// Sección de accesos y acciones rápidas del programa.
// Orquesta las cuatro cards: sesiones, certificado, comunidad, live.
// No tiene lógica de negocio: solo recibe props y compone.
// ============================================================

import { SessionCard } from "../../cards/SessionCard";
import { CertificateCard } from "../../cards/CertificateCard";
import { CommunityCard } from "../../cards/CommunityCard";
import { LiveSessionCard } from "../../cards/LiveSessionCard";
import { UpcomingSessionItem } from "../IndividualSessions/UpcomingSessions";

interface UpcomingLive {
  productName: string;
  productType: "workshop" | "course" | "program";
  startsAt: string;
  href: string;
}

interface QuickActionsSectionProps {
  remainingSessions: number;
  totalSessions: number;
  upcomingSessions?: UpcomingSessionItem[]; // ← nuevo
  certificateAvailable: boolean;
  totalIncludedProducts: number;
  whatsappCommunityUrl?: string;
  bookingUrl?: string;
  certificateUrl?: string;
  upcomingLive?: UpcomingLive;
}

export function QuickActionsSection({
  remainingSessions,
  totalSessions,
  upcomingSessions,
  certificateAvailable,
  totalIncludedProducts,
  whatsappCommunityUrl,
  bookingUrl,
  certificateUrl,
  upcomingLive,
}: QuickActionsSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-base font-semibold text-white/90">
        Accesos y acciones rápidas
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SessionCard
          remainingSessions={remainingSessions}
          totalSessions={totalSessions}
          bookingUrl={bookingUrl}
        />

        <CertificateCard
          available={certificateAvailable}
          totalIncludedProducts={totalIncludedProducts}
          certificateUrl={certificateUrl}
        />

        <CommunityCard whatsappUrl={whatsappCommunityUrl} />

        <LiveSessionCard upcomingLive={upcomingLive} />
      </div>
    </section>
  );
}
