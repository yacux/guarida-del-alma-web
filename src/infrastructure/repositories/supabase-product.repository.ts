// src/infrastructure/repositories/SupabaseProductRepository.ts
// =========================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { Product } from "@/core/entities/Product";
import { UUID } from "@/core/entities/shared";
import { IProductRepository } from "@/core/repositories/IProductRepository";

export class SupabaseProductRepository implements IProductRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // 🆕 MÉTODO AÑADIDO: Búsqueda por ID individual
  async findById(id: UUID): Promise<Product | null> {
    const respuesta = await this.supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (respuesta.error) {
      throw new Error(
        `Error buscando el producto por id en Supabase: ${respuesta.error.message}`,
      );
    }

    if (!respuesta.data) {
      return null;
    }

    return this.rowToDomain(respuesta.data);
  }

  async findAllActive(): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`[ProductRepository.findAllActive] ${error.message}`);
    }

    return (data ?? []).map((fila) => this.rowToDomain(fila));
  }

  async findByIds(ids: UUID[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    const respuesta = await this.supabase
      .from("products")
      .select("*")
      .in("id", ids);

    if (respuesta.error) {
      throw new Error(
        `Error cargando productos desde Supabase: ${respuesta.error.message}`,
      );
    }

    return (respuesta.data ?? []).map((fila) => this.rowToDomain(fila));
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const respuesta = await this.supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (respuesta.error) {
      throw new Error(
        `Error buscando el producto por slug en Supabase: ${respuesta.error.message}`,
      );
    }

    if (!respuesta.data) {
      return null;
    }

    return this.rowToDomain(respuesta.data);
  }

  // TRADUCTOR CENTRALIZADO (Mapper)
  // Convierte un registro de Supabase al formato estricto de nuestra entidad Product
  private rowToDomain(fila: any): Product {
    return {
      id: fila.id,
      name: fila.name,
      slug: fila.slug,
      description: fila.description,
      shortDescription: fila.short_description,

      priceUsd: fila.price_usd,
      priceArs: fila.price_ars,

      productType: fila.product_type,
      coverImageUrl: fila.cover_image_url,

      welcomeVideoUrl: fila.welcome_video_url,
      whatsappCommunityUrl: fila.whatsapp_community_url,
      //accessDurationMonths: fila.access_duration_months,

      isActive: fila.is_active,
      createdAt: fila.created_at,
      updatedAt: fila.updated_at,
    };
  }
}
