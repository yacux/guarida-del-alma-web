// =========================================================================
// src/infrastructure/repositories/SupabaseEnrollmentRepository.ts
// =========================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { Enrollment } from "@/core/entities/Enrollment";
import type { ClerkUserId } from "@/core/entities/shared";
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

  // 3. MÉTODO DEL CONTRATO
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
        studentId: fila.student_id, // <-- Traducido de snake_case
        productId: fila.product_id, // <-- Traducido de snake_case

        // Estos campos pueden ser NULL según tu entidad, TypeScript lo acepta perfecto
        orderId: fila.order_id, // <-- Traducido de snake_case
        source: fila.source,
        enrolledBy: fila.enrolled_by, // <-- Traducido de snake_case

        status: fila.status,
        startedAt: fila.started_at, // <-- Traducido de snake_case
        expiresAt: fila.expires_at, // <-- Traducido de snake_case

        // Control de sesiones (clave para los programas v3)
        sessionsTotal: fila.sessions_total, // <-- Traducido de snake_case
        sessionsUsed: fila.sessions_used, // <-- Traducido de snake_case

        notes: fila.notes,
        createdAt: fila.created_at, // <-- Traducido de snake_case
        updatedAt: fila.updated_at, // <-- Traducido de snake_case
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
}
