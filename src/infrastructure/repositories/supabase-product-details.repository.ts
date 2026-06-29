// ============================================================================
// src/infrastructure/repositories/supabase-product-details.repository.ts
//
// RESPONSABILIDAD
// ----------------
// Este repositorio reconstruye completamente un ProductVariant.
//
// A diferencia de SupabaseProductRepository,
// aquí NO devolvemos el Product base,
// sino la variante completa:
//
// • Course
// • Workshop
// • Program
//
// Para lograrlo:
//
// 1. Busca primero el producto en "products".
// 2. Detecta su tipo.
// 3. Consulta la tabla hija correspondiente.
// 4. Combina ambos resultados.
// ============================================================================

import { SupabaseClient } from "@supabase/supabase-js";

import type {
  Product,
  ProductVariant,
  Course,
  Workshop,
  Program,
} from "@/core/entities/Product";

import type { IProductDetailsRepository } from "@/core/repositories/IProductDetailsRepository";

export class SupabaseProductDetailsRepository implements IProductDetailsRepository {
  //---------------------------------------------------------------------------
  // Cliente de Supabase
  //---------------------------------------------------------------------------

  private readonly supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  //---------------------------------------------------------------------------
  // Busca un producto mediante su slug.
  //---------------------------------------------------------------------------

  async findBySlug(slug: string): Promise<ProductVariant | null> {
    //-----------------------------------------------------------------------
    // PASO 1
    // Recuperamos el producto base.
    //-----------------------------------------------------------------------

    const productResponse = await this.supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (productResponse.error) {
      throw new Error(productResponse.error.message);
    }

    if (!productResponse.data) {
      return null;
    }

    //-----------------------------------------------------------------------
    // Traducimos snake_case → camelCase
    //-----------------------------------------------------------------------

    const product: Product = {
      id: productResponse.data.id,
      name: productResponse.data.name,
      slug: productResponse.data.slug,
      description: productResponse.data.description,
      shortDescription: productResponse.data.short_description,
      price_usd: productResponse.data.price_usd,
      price_ars: productResponse.data.price_ars,
      productType: productResponse.data.product_type,
      coverImageUrl: productResponse.data.cover_image_url,
      welcomeVideoUrl: productResponse.data.welcome_video_url,
      hasWhatsappCommunity: productResponse.data.has_whatsapp_community,
      isActive: productResponse.data.is_active,
      createdAt: productResponse.data.created_at,
      updatedAt: productResponse.data.updated_at,
    };

    //-----------------------------------------------------------------------
    // PASO 2
    // Reconstruimos la variante.
    //-----------------------------------------------------------------------

    switch (product.productType) {
      //---------------------------------------------------------------------
      // CURSO
      //---------------------------------------------------------------------

      case "course": {
        const response = await this.supabase
          .from("product_courses")
          .select("*")
          .eq("product_id", product.id)
          .single();

        if (response.error) {
          throw new Error(response.error.message);
        }

        const course: Course = {
          ...product,

          productType: "course",

          courseDetails: {
            grantsCertificate: response.data.grants_certificate,

            approvalMinScore: response.data.approval_min_score,
          },
        };

        return course;
      }

      //---------------------------------------------------------------------
      // TALLER
      //---------------------------------------------------------------------

      case "workshop": {
        const response = await this.supabase
          .from("product_workshops")
          .select("*")
          .eq("product_id", product.id)
          .single();

        if (response.error) {
          throw new Error(response.error.message);
        }

        const workshop: Workshop = {
          ...product,

          productType: "workshop",

          workshopDetails: {
            globalPdfUrl: response.data.global_pdf_url,
          },
        };

        return workshop;
      }

      //---------------------------------------------------------------------
      // PROGRAMA
      //---------------------------------------------------------------------

      case "program": {
        //---------------------------------------------------------------
        // Datos propios del programa
        //---------------------------------------------------------------

        const response = await this.supabase
          .from("product_programs")
          .select("*")
          .eq("product_id", product.id)
          .single();

        if (response.error) {
          throw new Error(response.error.message);
        }

        //---------------------------------------------------------------
        // Productos incluidos
        //---------------------------------------------------------------

        const includedProductsResponse = await this.supabase
          .from("program_included_products")
          .select("included_product_id")
          .eq("program_product_id", product.id);

        if (includedProductsResponse.error) {
          throw new Error(includedProductsResponse.error.message);
        }

        const program: Program = {
          ...product,

          productType: "program",

          programDetails: {
            individualSessionsCount: response.data.individual_sessions_count,

            grantsCertificate: response.data.grants_certificate,

            approvalMinScore: response.data.approval_min_score,

            includedProductIds: includedProductsResponse.data.map(
              (p) => p.included_product_id,
            ),
          },
        };

        return program;
      }
    }
  }
}
