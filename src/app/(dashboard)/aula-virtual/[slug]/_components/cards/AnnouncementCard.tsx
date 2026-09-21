// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/AnnouncementCard.tsx
//
// Card de anuncio estilo banner horizontal con Modal desplegable.
// Muestra el anuncio más reciente y permite abrir un modal con
// el historial completo de anuncios.
// ============================================================

"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import type { Announcement } from "@/core/entities/Announcement";

interface AnnouncementCardProps {
  /** Anuncio principal que se muestra en el banner horizontal */
  announcement: Announcement;
  /** Lista completa de anuncios para mostrar en el modal */
  allAnnouncements?: Announcement[];
}

/** Un anuncio se considera "nuevo" si tiene menos de 7 días */
function isNew(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export function AnnouncementCard({
  announcement,
  allAnnouncements = [],
}: AnnouncementCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const showNewBadge = isNew(announcement.createdAt);

  return (
    <>
      {/* Banner Principal */}
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

        {/* Botón para abrir el Modal */}
        {allAnnouncements.length > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="ml-auto shrink-0 whitespace-nowrap text-sm font-medium text-guarida-fuchsia transition-opacity hover:opacity-70 focus:outline-none"
          >
            Ver todos los anuncios →
          </button>
        )}
      </div>

      {/* MODAL / DIÁLOGO */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-guarida-dark-violet p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Previene cerrar el modal si hacen click adentro
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-guarida-fuchsia/15">
                  <Megaphone className="h-4 w-4 text-guarida-fuchsia" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Anuncios ({allAnnouncements.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista de Anuncios */}
            <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {allAnnouncements.map((item) => {
                const itemIsNew = isNew(item.createdAt);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/2 p-4 transition-colors hover:border-white/10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.isPinned && <span title="Fijado">📌</span>}
                        <h4 className="text-sm font-semibold text-white">
                          {item.title}
                        </h4>
                        {itemIsNew && (
                          <span className="rounded-full bg-guarida-fuchsia/20 px-2 py-0.5 text-[10px] font-medium text-guarida-fuchsia">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40">
                        {new Date(item.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-line text-sm text-white/70 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
