// ============================================================================
// src/core/repositories/IModuleRepository.ts
//
// RESPONSABILIDAD
// ----------------
// Este repositorio conoce toda la estructura académica de un curso.
//
// Devuelve:
//
// • módulos
// • videos
// • PDF
// • tarea del módulo
// • actividad final
//
// No sabe nada de Supabase.
// Sólo define el contrato.
//
// Será utilizado por GetProductDetailsUseCase.
//
// ============================================================================

import type {
  CourseModule,
  ModuleResource,
  ModuleAssignment,
  FinalActivity,
} from "../entities/Module";

import type { UUID } from "../entities/shared";

export interface IModuleRepository {
  /**
   * Devuelve todos los módulos de un curso.
   *
   * Siempre ordenados por orderIndex.
   */
  findModulesByCourseId(courseId: UUID): Promise<CourseModule[]>;

  /**
   * Devuelve todos los recursos
   * pertenecientes a un módulo.
   */
  findVideosByModuleId(moduleId: UUID): Promise<ModuleResource[]>;

  /**
   * Devuelve la tarea asociada
   * a un módulo.
   *
   * Si el módulo no tiene tarea,
   * devuelve null.
   */
  findAssignmentByModuleId(moduleId: UUID): Promise<ModuleAssignment | null>;

  /**
   * Devuelve la actividad final
   * del curso.
   *
   * Sólo existe una.
   */
  findFinalActivityByCourseId(courseId: UUID): Promise<FinalActivity | null>;
}
/*

Lo mejor de este diseño,
el repositorio del detalle del curso puede reconstruir algo muy natural:

Course
 ├── Module 1
 │     ├── Resource (video)
 │     ├── Resource (pdf)
 │     ├── Resource (audio)
 │     └── Assignment
 │
 ├── Module 2
 │     ├── Resource (video)
 │     ├── Resource (video)
 │     ├── Resource (pdf)
 │     └── Assignment
 │
 └── FinalActivity
*/
