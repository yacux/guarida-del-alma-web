// ============================================================
// src/core/entities/Announcement.ts
// Foro de avisos: anuncios por producto o globales de plataforma.
// Hebe puede vincular un anuncio a una reunión próxima.
// ============================================================

import type { UUID, ISODateString } from "./shared";

export interface Announcement {
  id: UUID;
  /**
   * null → anuncio global de la plataforma.
   * UUID → anuncio del foro de ese curso, taller o programa.
   */
  productId: UUID | null;
  /**
   * Cuando se anuncia una reunión próxima, este campo vincula
   * el anuncio con la fila en meetings.
   */
  meetingId: UUID | null;
  /** Hebe (admin) es siempre la autora */
  authorId: UUID;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type CreateAnnouncementInput = Omit<
  Announcement,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateAnnouncementInput = Partial<
  Pick<Announcement, "title" | "content" | "isPinned" | "meetingId">
>;
