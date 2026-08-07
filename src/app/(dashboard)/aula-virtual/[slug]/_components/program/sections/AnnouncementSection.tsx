// ============================================================
// src/app/(dashboard)/aula-virtual/_components/program/sections/AnnouncementSection.tsx
//
// Sección de avisos del programa.
// Muestra el aviso más reciente/pinneado como banner.
// Si no hay avisos, no renderiza nada (null).
// ============================================================

import type { Announcement } from "@/core/entities/Announcement";
import { AnnouncementCard } from "../../cards/AnnouncementCard";

interface AnnouncementSectionProps {
  announcements: Announcement[];
  allAnnouncementsHref?: string;
}

export function AnnouncementSection({
  announcements,
  allAnnouncementsHref,
}: AnnouncementSectionProps) {
  // El repositorio ya devuelve los anuncios ordenados:
  // pinneados primero, después por fecha desc.
  // Mostramos solo el primero como banner destacado.
  const latest = announcements[0];

  if (!latest) return null;

  return (
    <AnnouncementCard
      announcement={latest}
      allAnnouncementsHref={allAnnouncementsHref}
    />
  );
}
