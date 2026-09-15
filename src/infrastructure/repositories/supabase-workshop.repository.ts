// ============================================================
// src/infrastructure/repositories/supabase-workshop.repository.ts
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IWorkshopRepository } from "@/core/repositories/IWorkshopRepository";
import type { WorkshopResource } from "@/core/entities/Module";
import type { UUID } from "@/core/entities/shared";

interface ResourceRow {
  id: string;
  product_id: string;
  title: string;
  resource_type: string;
  url: string | null;
  storage_path: string | null;
  duration_seconds: number | null;
  order_index: number;
  created_at: string;
}

export class SupabaseWorkshopRepository implements IWorkshopRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findResourcesByProductId(productId: UUID): Promise<WorkshopResource[]> {
    const { data, error } = await this.client
      .from("workshop_learning_resources")
      .select("*")
      .eq("product_id", productId)
      .order("order_index", { ascending: true });

    if (error)
      throw new Error(
        `[WorkshopRepository.findResourcesByProductId] ${error.message}`,
      );

    return (data ?? []).map((r: ResourceRow) => ({
      id: r.id,
      productId: r.product_id,
      title: r.title,
      resourceType: r.resource_type as WorkshopResource["resourceType"],
      url: r.url,
      storagePath: r.storage_path,
      durationSeconds: r.duration_seconds,
      orderIndex: r.order_index,
      createdAt: r.created_at,
    }));
  }
}
