// ============================================================
// src/core/repositories/ISubmissionRepository.ts
//
// Contrato para leer y crear entregas de tareas de módulo.
//
// IMPORTANTE — Acceso directo vs. acceso por programa:
//   Los métodos de lectura filtran por (assignment_id + student_id)
//   y NUNCA por enrollment_id. Una entrega es de un alumno para
//   una tarea concreta, sin importar qué matrícula generó el acceso.
//
//   El enrollment_id que se guarda en la entrega es responsabilidad
//   del caso de uso que la crea (SubmitAssignmentUseCase), no de
//   este repositorio.
// ============================================================

import type {
  ModuleSubmission,
  ModuleSubmissionFeedback,
  CreateModuleSubmissionInput,
} from "../entities/Submission";
import type { UUID } from "../entities/shared";
import type { ClerkUserId } from "../entities/shared";

export interface ISubmissionRepository {
  /**
   * Devuelve el último intento del alumno para una tarea dada.
   *
   * "Último" = attempt_number más alto.
   * Devuelve null si el alumno nunca entregó esa tarea.
   *
   * Casos de uso:
   *   • GetModuleContentsUseCase → saber si puede entregar / re-entregar
   *   • Vista del módulo → mostrar la última entrega y su estado
   */
  findLatestByAssignmentAndStudent(
    assignmentId: UUID,
    studentId: ClerkUserId,
  ): Promise<ModuleSubmission | null>;

  /**
   * Todos los intentos del alumno para una tarea, ordenados por
   * attempt_number ASC.
   *
   * Útil para mostrar el historial completo de entregas en la UI
   * (intento 1 fallido → intento 2 aprobado).
   * los parametros pasados son assignmentId o sea el ID de la tarea y studentId o sea el ID del alumno
   */
  findAllByAssignmentAndStudent(
    assignmentId: UUID,
    studentId: ClerkUserId,
  ): Promise<ModuleSubmission[]>;

  /**
   * El feedback de Hebe para una entrega concreta.
   * Devuelve null si Hebe todavía no corrigió esa entrega.
   *
   * La tabla tiene UNIQUE (submission_id), por lo que
   * siempre hay 0 o 1 feedback por entrega.
   * el parametro pasado es submissionId o sea el ID de la entrega
   */
  findFeedbackBySubmissionId(
    submissionId: UUID,
  ): Promise<ModuleSubmissionFeedback | null>;

  /**
   * Crea una nueva entrega.
   *
   * El attempt_number lo calcula el caso de uso antes de llamar
   * a este método (último attempt + 1, o 1 si es la primera vez).
   *
   * El trigger fn_unlock_next_module_on_submit se dispara
   * automáticamente en la DB cuando attempt_number = 1.
   */
  createSubmission(
    input: CreateModuleSubmissionInput,
  ): Promise<ModuleSubmission>;
}
