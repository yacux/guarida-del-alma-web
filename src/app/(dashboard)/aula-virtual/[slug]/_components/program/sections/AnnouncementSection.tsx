// ============================================================
// src/app/(dashboard)/aula-virtual/_components/program/sections/AnnouncementSection.tsx
//
// Sección de avisos del programa.
// Muestra el aviso más reciente/pinneado como banner y pasa
// todo el historial de avisos para abrir el modal.
// ============================================================

import type { Announcement } from "@/core/entities/Announcement";
import { AnnouncementCard } from "../../cards/AnnouncementCard";

interface AnnouncementSectionProps {
  announcements: Announcement[];
}

export function AnnouncementSection({
  announcements,
}: AnnouncementSectionProps) {
  // El repositorio ya devuelve los anuncios ordenados.
  // Tomamos el primero para el banner principal.
  const latest = announcements[0];

  if (!latest) return null;

  return (
    <AnnouncementCard
      announcement={latest}
      allAnnouncements={announcements} // 👈 Le pasamos la lista completa de anuncios para el Modal
    />
  );
}
