// ============================================================
// src/core/repositories/IModuleRepository.ts
//
// Contrato para acceder al contenido de los módulos
// y al progreso del alumno dentro de un curso.
//
// IMPORTANTE — Acceso directo vs. acceso por programa:
//   Los métodos de progreso filtran por (student_id + product_id)
//   y NUNCA por enrollment_id. Esto garantiza que funcionen igual
//   cuando el alumno compró el curso directamente o lo accede
//   a través de un programa que lo incluye.
// ============================================================

import type {
  CourseModule,
  ModuleResource,
  ModuleAssignment,
} from "../entities/Module";
import type { ModuleProgress } from "../entities/StudentProgress";
import type { UUID } from "../entities/shared";
import type { ClerkUserId } from "../entities/shared";

export interface IModuleRepository {
  // ── Contenido (sin contexto de alumno) ──────────────────────

  /**
   * Todos los módulos de un curso, ordenados por order_index ASC.
   * No incluye recursos ni assignments (consultas separadas).
   */
  findByCourseId(courseProductId: UUID): Promise<CourseModule[]>;

  /**
   * Un módulo concreto por su posición en el curso.
   * Usado por la ruta /aula-virtual/[slug]/modulos/[order].
   */
  findByOrderInCourse(
    courseProductId: UUID,
    orderIndex: number,
  ): Promise<CourseModule | null>;

  /**
   * Recursos del módulo ordenados por order_index ASC.
   * Tabla: module_learning_resources.
   * Tipos posibles: video | pdf | audio | download | external_link
   */
  findResourcesByModuleId(moduleId: UUID): Promise<ModuleResource[]>;

  /**
   * La tarea del módulo (máximo 1 por módulo).
   * Devuelve null si el módulo no tiene tarea asignada.
   */
  findAssignmentByModuleId(moduleId: UUID): Promise<ModuleAssignment | null>;

  // ── Progreso del alumno ─────────────────────────────────────

  /**
   * Estado de todos los módulos de un curso para un alumno.
   *
   * Implementación: JOIN de student_module_progress con modules
   * filtrando por (student_id + modules.product_id).
   *
   * NO filtra por enrollment_id → funciona igual para:
   *   • Alumno con matrícula directa del curso
   *   • Alumno con matrícula de programa que lo incluye
   *
   * Devuelve solo las filas que existen (módulos bloqueados
   * directamente no tienen fila → el use case los interpreta como 'locked').
   */
  findProgressByStudentAndCourse(
    studentId: ClerkUserId,
    courseProductId: UUID,
  ): Promise<ModuleProgress[]>;

  /**
   * Progreso de un módulo específico para un alumno.
   * Devuelve null si el módulo está bloqueado (sin fila en la tabla).
   */
  findProgressByStudentAndModule(
    studentId: ClerkUserId,
    moduleId: UUID,
  ): Promise<ModuleProgress | null>;
}
