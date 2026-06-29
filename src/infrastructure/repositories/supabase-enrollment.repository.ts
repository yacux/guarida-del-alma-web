// =========================================================================
// src/infrastructure/repositories/supabase-enrollment.repository.ts
// =========================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { Enrollment } from "@/core/entities/Enrollment";
import type { ClerkUserId, UUID } from "@/core/entities/shared"; // <-- Añadimos UUID aquí
import { IEnrollmentRepository } from "@/core/repositories/IEnrollmentRepository";

export class SupabaseEnrollmentRepository implements IEnrollmentRepository {
  // 1. DECLARACIÓN DE PROPIEDAD
  // Reservamos el espacio para el cliente de Supabase.
  private readonly supabase: SupabaseClient;

  // 2. CONSTRUCTOR TRADICIONAL
  // Recibimos el cliente inyectado desde afuera y lo guardamos.
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // 3. MÉTODO DEL CONTRATO: LISTADO DE MATRÍCULAS
  // Recibe el ID de Clerk de la alumna y promete devolver su lista de matrículas activas.
  async findActiveByStudentId(studentId: ClerkUserId): Promise<Enrollment[]> {
    // -------------------------------------------------------------------------
    // PASO A: CONSULTA FILTRADA A LA BASE DE DATOS
    // Vamos a la tabla 'enrollments' y aplicamos dos filtros estrictos (.eq):
    // 1. Que el 'student_id' sea igual al de la alumna que inició sesión.
    // 2. Que el 'status' sea exactamente 'active'.
    // -------------------------------------------------------------------------
    const respuesta = await this.supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "active");

    // -------------------------------------------------------------------------
    // PASO B: CONTROL DE ERRORES
    // Si la base de datos se cayó, fallaron los permisos (RLS) o hay mala sintaxis,
    // cortamos el flujo y avisamos qué pasó.
    // -------------------------------------------------------------------------
    if (respuesta.error) {
      throw new Error(
        `Error cargando matrículas desde Supabase: ${respuesta.error.message}`,
      );
    }

    // -------------------------------------------------------------------------
    // PASO C: EXTRACCIÓN Y TRADUCCIÓN (Mapping uno a uno)
    // Extraemos las filas encontradas (.data) y preparamos nuestra lista limpia.
    // -------------------------------------------------------------------------
    const filasDeLaBaseDeDatos = respuesta.data;
    const listaDeMatriculasLimpia: Enrollment[] = [];

    // Recorremos las filas con un bucle FOR tradicional
    for (const fila of filasDeLaBaseDeDatos) {
      // Construimos el objeto traduciendo cada columna de snake_case a camelCase
      const matriculaTraducida: Enrollment = {
        id: fila.id,
        studentId: fila.student_id,
        productId: fila.product_id,

        orderId: fila.order_id,
        source: fila.source,
        enrolledBy: fila.enrolled_by,

        status: fila.status,
        startedAt: fila.started_at,
        expiresAt: fila.expires_at,

        sessionsTotal: fila.sessions_total,
        sessionsUsed: fila.sessions_used,

        notes: fila.notes,
        createdAt: fila.created_at,
        updatedAt: fila.updated_at,
      };

      // Guardamos la matrícula ya formateada en nuestra lista de salida
      listaDeMatriculasLimpia.push(matriculaTraducida);
    }
    // -------------------------------------------------------------------------
    // PASO D: RETORNO DE DATOS
    // Devolvemos las matrículas en el formato exacto que el Core y el Caso de Uso esperan.
    // -------------------------------------------------------------------------
    return listaDeMatriculasLimpia;
  }

  // 4. OTRO MÉTODO DEL CONTRATO: VERIFICACIÓN DE ACCESO
  // Recupera la matrícula activa correspondiente a un producto específico.
  async findActiveByStudentAndProduct(
    studentId: ClerkUserId,
    productId: UUID,
  ): Promise<Enrollment | null> {
    // -------------------------------------------------------------------------
    // PASO A: CONSULTA PARA UN ÚNICO REGISTRO
    // Aplicamos tres filtros: alumna, producto y estado activo.
    // Usamos .maybeSingle() en lugar de .single() porque es perfectamente
    // válido y normal que no exista matrícula (devuelve null sin lanzar error).
    // -------------------------------------------------------------------------
    const respuesta = await this.supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
      .eq("product_id", productId)
      .eq("status", "active")
      .maybeSingle();

    // -------------------------------------------------------------------------
    // PASO B: CONTROL DE ERRORES
    // -------------------------------------------------------------------------
    if (respuesta.error) {
      throw new Error(
        `Error verificando acceso al producto en Supabase: ${respuesta.error.message}`,
      );
    }

    // -------------------------------------------------------------------------
    // PASO C: COMPROBACIÓN DE EXISTENCIA
    // Si la alumna no compró esto o ya expiró, data será null.
    // En ese caso, cortamos rápido y devolvemos null al Caso de Uso.
    // -------------------------------------------------------------------------
    if (!respuesta.data) {
      return null;
    }

    // -------------------------------------------------------------------------
    // PASO D: EXTRACCIÓN Y TRADUCCIÓN (Mapping de un solo objeto)
    // Extraemos la única fila encontrada y la traducimos a nuestro formato Core.
    // -------------------------------------------------------------------------
    const fila = respuesta.data;

    const matriculaTraducida: Enrollment = {
      id: fila.id,
      studentId: fila.student_id,
      productId: fila.product_id,
      orderId: fila.order_id,
      source: fila.source,
      enrolledBy: fila.enrolled_by,
      status: fila.status,
      startedAt: fila.started_at,
      expiresAt: fila.expires_at,
      sessionsTotal: fila.sessions_total,
      sessionsUsed: fila.sessions_used,
      notes: fila.notes,
      createdAt: fila.created_at,
      updatedAt: fila.updated_at,
    };

    // -------------------------------------------------------------------------
    // PASO E: RETORNO DE DATOS
    // -------------------------------------------------------------------------
    return matriculaTraducida;
  }
}
