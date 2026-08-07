// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/AnnouncementCard.tsx
//
// Card de anuncio estilo banner horizontal.
// Muestra un único aviso con icono, título, badge "Nuevo" y contenido.
// Reutilizable desde cualquier sección que necesite mostrar un aviso.
// ============================================================

import { Megaphone } from "lucide-react";
import type { Announcement } from "@/core/entities/Announcement";

interface AnnouncementCardProps {
  announcement: Announcement;
  /** URL interna para "Ver todos los anuncios" */
  allAnnouncementsHref?: string;
}

/** Un anuncio se considera "nuevo" si tiene menos de 7 días */
function isNew(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export function AnnouncementCard({
  announcement,
  allAnnouncementsHref,
}: AnnouncementCardProps) {
  const showNewBadge = isNew(announcement.createdAt);

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-guarida-dark-violet px-5 py-4">
      {/* Icono */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-guarida-fuchsia/15">
        <Megaphone className="h-4 w-4 text-guarida-fuchsia" />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        {/* Título + badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {announcement.title}
          </span>
          {showNewBadge && (
            <span className="rounded-full bg-guarida-fuchsia/20 px-2 py-0.5 text-xs font-medium text-guarida-fuchsia">
              Nuevo
            </span>
          )}
        </div>

        {/* Texto del anuncio */}
        <p className="line-clamp-2 text-sm text-white/60">
          {announcement.content}
        </p>
      </div>

      {/* Link "Ver todos" */}
      {allAnnouncementsHref && (
        <a
          href={allAnnouncementsHref}
          className="ml-auto shrink-0 whitespace-nowrap text-sm font-medium text-guarida-fuchsia transition-opacity hover:opacity-70"
        >
          Ver todos los anuncios →
        </a>
      )}
    </div>
  );
}
