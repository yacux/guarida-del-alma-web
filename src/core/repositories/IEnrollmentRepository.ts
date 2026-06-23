// ============================================================
// src/core/repositories/IEnrollmentRepository.ts
//
// Contrato para acceder a las matrículas (Enrollments) de una
// alumna.
//
// Esta interfaz pertenece al Core y NO sabe nada de Supabase,
// Clerk ni PostgreSQL.
//
// El objetivo es permitir que los Casos de Uso trabajen con
// matrículas sin depender de detalles de infraestructura.
// ============================================================

import { Enrollment } from "../entities/Enrollment";
import { ClerkUserId } from "../entities/shared";

export interface IEnrollmentRepository {
  /**
   * Devuelve todas las matrículas activas de una alumna.
   *
   * Incluye:
   * - Cursos comprados
   * - Talleres comprados
   * - Programas comprados
   */
  findActiveByStudentId(studentId: ClerkUserId): Promise<Enrollment[]>;
}
