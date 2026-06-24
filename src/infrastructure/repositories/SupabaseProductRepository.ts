// Esta clase vive en src/infrastructure/repositories/SupabaseProductRepository.ts.
// Su único trabajo es hablar el idioma de la base de datos (SQL / snake_case)
// y traducir los resultados al idioma de nuestro Core (TypeScript / camelCase).

// este repositorio es el encargado de pedir los productos en la base de datos de Supabase.
// los repositorios son la capa que conecta el mundo exterior (bases de datos, APIs, etc.) con nuestro Core limpio.

// Importamos las interfaces necesarias del Core
// src/infrastructure/repositories/SupabaseProductRepository.ts
// =========================================================================
// src/infrastructure/repositories/SupabaseProductRepository.ts
// =========================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { Product } from "@/core/entities/Product";
import { UUID } from "@/core/entities/shared";
import { IProductRepository } from "@/core/repositories/IProductRepository";

export class SupabaseProductRepository implements IProductRepository {
  // 1. DECLARACIÓN DE PROPIEDAD
  // Guardamos espacio para nuestro "control remoto" de Supabase.
  private readonly supabase: SupabaseClient;

  // 2. CONSTRUCTOR TRADICIONAL
  // Recibimos el cliente desde afuera y lo asignamos formalmente con 'this'.
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // 3. MÉTODO PRINCIPAL
  // Recibe una lista de IDs únicos (UUIDs) y promete devolver una lista de Productos base.
  async findByIds(ids: UUID[]): Promise<Product[]> {
    // -------------------------------------------------------------------------
    // PASO A: CONTROL DE SEGURIDAD (Guard Clause)
    // Si el Caso de Uso nos pasa una lista vacía, respondemos al instante.
    // Así evitamos hacer un viaje innecesario a internet y a la base de datos.
    // -------------------------------------------------------------------------
    if (ids.length === 0) {
      return [];
    }

    // -------------------------------------------------------------------------
    // PASO B: CONSULTA A LA BASE DE DATOS
    // Hacemos el llamado y guardamos el paquete de respuesta entero en una variable.
    // El operador '.in()' busca todas las filas cuyo ID coincida con los de nuestra lista.
    // -------------------------------------------------------------------------
    const respuesta = await this.supabase
      .from("products")
      .select("*")
      .in("id", ids);

    // -------------------------------------------------------------------------
    // PASO C: CONTROL DE ERRORES
    // Revisamos si el paquete de respuesta contiene algún error de conexión o sintaxis.
    // Si algo falló, frenamos la ejecución lanzando una excepción.
    // -------------------------------------------------------------------------
    if (respuesta.error) {
      throw new Error(
        `Error cargando productos desde Supabase: ${respuesta.error.message}`,
      );
    }

    // -------------------------------------------------------------------------
    // PASO D: EXTRACCIÓN Y TRADUCCIÓN (Mapping)
    // Sacamos las filas crudas de la base de datos que vienen dentro de '.data'.
    // Creamos también una lista limpia y vacía lista para llenarse.
    // -------------------------------------------------------------------------
    const filasDeLaBaseDeDatos = respuesta.data;
    const listaDeProductosLimpia: Product[] = [];

    // Recorremos las filas una por una usando el bucle FOR tradicional
    for (const fila of filasDeLaBaseDeDatos) {
      // Construimos un objeto que respete de forma estricta la interfaz Product de tu Core
      const productoTraducido: Product = {
        id: fila.id,
        name: fila.name,
        slug: fila.slug,
        description: fila.description,
        shortDescription: fila.short_description, // <-- Traducido de snake_case a camelCase

        // Mantenemos los guiones bajos porque así lo definieron en la interfaz Product.ts
        price_usd: fila.price_usd,
        price_ars: fila.price_ars,

        productType: fila.product_type, // <-- Traducido de snake_case a camelCase
        coverImageUrl: fila.cover_image_url, // <-- Traducido de snake_case a camelCase

        // Propiedades universales añadidas en la Entidad V3:
        accessDurationMonths: fila.access_duration_months, // <-- Traducido
        welcomeVideoUrl: fila.welcome_video_url, // <-- Traducido
        hasWhatsappCommunity: fila.has_whatsapp_community, // <-- Traducido

        isActive: fila.is_active, // <-- Traducido
        createdAt: fila.created_at,
        updatedAt: fila.updated_at,
      };

      // Metemos nuestro objeto nuevo y limpio en la bolsa de salida
      listaDeProductosLimpia.push(productoTraducido);
    }

    // -------------------------------------------------------------------------
    // PASO E: RETORNO DE DATOS
    // Enviamos la lista de entidades al Caso de Uso, en su propio "idioma" (camelCase).
    // -------------------------------------------------------------------------
    return listaDeProductosLimpia;
  }
}

/*
Cómo se usaría en page.tsx o cualquier server component:

TypeScript
const supabase = createSupabaseServerClient(); // Creás el cliente de Next.js
const productRepo = new SupabaseProductRepository(supabase); // Se lo inyectás
*/
