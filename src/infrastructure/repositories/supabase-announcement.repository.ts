// ============================================================
// src/infrastructure/repositories/supabase-announcement.repository.ts
//
// Implementación concreta de IAnnouncementRepository para Supabase.
// Mapea snake_case de la DB → camelCase de la entidad de dominio.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IAnnouncementRepository } from "@/core/repositories/IAnnouncementRepository";
import type {
  Announcement,
  CreateAnnouncementInput,
} from "@/core/entities/Announcement";
import type { UUID } from "@/core/entities/shared";

// Shape cruda de la fila en Supabase
interface AnnouncementRow {
  id: string;
  product_id: string | null;
  meeting_id: string | null;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseAnnouncementRepository implements IAnnouncementRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByProductId(productId: UUID): Promise<Announcement[]> {
    const { data, error } = await this.client
      .from("announcements")
      .select("*")
      .eq("product_id", productId)
      // Primero los pinneados, después por fecha descendente
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        `[SupabaseAnnouncementRepository] Error al obtener anuncios: ${error.message}`,
      );
    }

    if (!data || data.length === 0) return [];

    return data.map((row: AnnouncementRow) => this.toDomain(row));
  }

  async create(input: CreateAnnouncementInput): Promise<Announcement> {
    const { data, error } = await this.client
      .from("announcements")
      .insert({
        product_id: input.productId,
        meeting_id: input.meetingId,
        author_id: input.authorId,
        title: input.title,
        content: input.content,
        is_pinned: input.isPinned,
      })
      .select()
      .single();

    if (error)
      throw new Error(`[AnnouncementRepository.create] ${error.message}`);
    return this.toDomain(data); // usar el mapper privado ya existente
  }

  private toDomain(row: AnnouncementRow): Announcement {
    return {
      id: row.id,
      productId: row.product_id,
      meetingId: row.meeting_id,
      authorId: row.author_id,
      title: row.title,
      content: row.content,
      isPinned: row.is_pinned,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
