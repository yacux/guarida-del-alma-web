// Esta clase vive en src/infrastructure/repositories/SupabaseProductRepository.ts.
// Su único trabajo es hablar el idioma de la base de datos (SQL / snake_case)
// y traducir los resultados al idioma de nuestro Core (TypeScript / camelCase).

// este repositorio es el encargado de pedir los productos en la base de datos de Supabase.
// los repositorios son la capa que conecta el mundo exterior (bases de datos, APIs, etc.) con nuestro Core limpio.

// Importamos las interfaces necesarias del Core
// src/infrastructure/repositories/SupabaseProductRepository.ts// =========================================================================
// src/infrastructure/repositories/supabase-product.repository.ts
// =========================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { Product } from "@/core/entities/Product";
import { UUID } from "@/core/entities/shared";
import { IProductRepository } from "@/core/repositories/IProductRepository"; // (Recuerda que luego puedes quitarle la 'I')

export class SupabaseProductRepository implements IProductRepository {
  // 1. DECLARACIÓN DE PROPIEDAD
  // Guardamos espacio para nuestro "control remoto" de Supabase.
  private readonly supabase: SupabaseClient;

  // 2. CONSTRUCTOR TRADICIONAL
  // Recibimos el cliente desde afuera y lo asignamos formalmente con 'this'.
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // 3. MÉTODO PRINCIPAL: BÚSQUEDA POR MÚLTIPLES IDs
  // Recibe una lista de IDs únicos (UUIDs) y promete devolver una lista de Productos base.
  async findByIds(ids: UUID[]): Promise<Product[]> {
    // -------------------------------------------------------------------------
    // PASO A: CONTROL DE SEGURIDAD (Guard Clause)
    // -------------------------------------------------------------------------
    if (ids.length === 0) {
      return [];
    }

    // -------------------------------------------------------------------------
    // PASO B: CONSULTA A LA BASE DE DATOS
    // -------------------------------------------------------------------------
    const respuesta = await this.supabase
      .from("products")
      .select("*")
      .in("id", ids);

    // -------------------------------------------------------------------------
    // PASO C: CONTROL DE ERRORES
    // -------------------------------------------------------------------------
    if (respuesta.error) {
      throw new Error(
        `Error cargando productos desde Supabase: ${respuesta.error.message}`,
      );
    }

    // -------------------------------------------------------------------------
    // PASO D: EXTRACCIÓN Y TRADUCCIÓN (Mapping)
    // -------------------------------------------------------------------------
    const filasDeLaBaseDeDatos = respuesta.data;
    const listaDeProductosLimpia: Product[] = [];

    for (const fila of filasDeLaBaseDeDatos) {
      const productoTraducido: Product = {
        id: fila.id,
        name: fila.name,
        slug: fila.slug,
        description: fila.description,
        shortDescription: fila.short_description,

        price_usd: fila.price_usd,
        price_ars: fila.price_ars,

        productType: fila.product_type,
        coverImageUrl: fila.cover_image_url,

        welcomeVideoUrl: fila.welcome_video_url,
        hasWhatsappCommunity: fila.has_whatsapp_community,

        isActive: fila.is_active,
        createdAt: fila.created_at,
        updatedAt: fila.updated_at,
      };

      listaDeProductosLimpia.push(productoTraducido);
    }

    // -------------------------------------------------------------------------
    // PASO E: RETORNO DE DATOS
    // -------------------------------------------------------------------------
    return listaDeProductosLimpia;
  }

  // 4. NUEVO MÉTODO: BÚSQUEDA POR SLUG (Para URLs amigables)
  // Busca un único producto utilizando su identificador de URL.
  async findBySlug(slug: string): Promise<Product | null> {
    // -------------------------------------------------------------------------
    // PASO A: CONSULTA PARA UN ÚNICO REGISTRO
    // Filtramos por la columna 'slug'. Usamos .maybeSingle() porque si alguien
    // ingresa a una URL falsa (ej. /aula-virtual/curso-inventado), Supabase
    // devolverá null en vez de romper la aplicación con un error.
    // -------------------------------------------------------------------------
    const respuesta = await this.supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    // -------------------------------------------------------------------------
    // PASO B: CONTROL DE ERRORES
    // Si hubo un problema de conexión o sintaxis, lanzamos el error.
    // -------------------------------------------------------------------------
    if (respuesta.error) {
      throw new Error(
        `Error buscando el producto por slug en Supabase: ${respuesta.error.message}`,
      );
    }

    // -------------------------------------------------------------------------
    // PASO C: COMPROBACIÓN DE EXISTENCIA
    // Si la URL estaba mal o el producto no existe, devolvemos null de inmediato.
    // -------------------------------------------------------------------------
    if (!respuesta.data) {
      return null;
    }

    // -------------------------------------------------------------------------
    // PASO D: EXTRACCIÓN Y TRADUCCIÓN (Mapping de un solo objeto)
    // -------------------------------------------------------------------------
    const fila = respuesta.data;

    const productoTraducido: Product = {
      id: fila.id,
      name: fila.name,
      slug: fila.slug,
      description: fila.description,
      shortDescription: fila.short_description,

      price_usd: fila.price_usd,
      price_ars: fila.price_ars,

      productType: fila.product_type,
      coverImageUrl: fila.cover_image_url,

      welcomeVideoUrl: fila.welcome_video_url,
      hasWhatsappCommunity: fila.has_whatsapp_community,

      isActive: fila.is_active,
      createdAt: fila.created_at,
      updatedAt: fila.updated_at,
    };

    // -------------------------------------------------------------------------
    // PASO E: RETORNO DE DATOS
    // Entregamos el producto listo para ser usado por el Caso de Uso.
    // -------------------------------------------------------------------------
    return productoTraducido;
  }
}
/*
Cómo se usaría en page.tsx o cualquier server component:

TypeScript
const supabase = createSupabaseServerClient(); // Creás el cliente de Next.js
const productRepo = new SupabaseProductRepository(supabase); // Se lo inyectás
*/
