// ============================================================
// src/core/repositories/IEnrollmentRepository.ts
//
// Contrato de acceso a matrículas (Enrollments).
//
// La capa de Application depende de esta interfaz y no conoce
// detalles de Supabase.
//
// Las implementaciones concretas vivirán en Infrastructure.
//
// Primer consumidor:
//   GetStudentDashboardUseCase
// ese caso de uso necesita mostrar que se compro.
// o sea los enrollments, no necesita entitlements. Los enti
// ============================================================

import { Enrollment } from "@/core/entities/Enrollment";
import type { ClerkUserId } from "@/core/entities/shared";

export interface IEnrollmentRepository {
  /**
   * Devuelve todas las matrículas activas de una alumna.
   *
   * Se utiliza para construir el Dashboard principal
   * del Aula Virtual.
   */
  findActiveByStudentId(studentId: ClerkUserId): Promise<Enrollment[]>;
}
