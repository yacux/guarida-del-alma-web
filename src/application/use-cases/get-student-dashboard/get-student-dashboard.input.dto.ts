import type { ClerkUserId } from "@/core/entities/shared";

// dto de entrada para obtener el dashboard del estudiante
//
export interface GetStudentDashboardInput {
  studentId: ClerkUserId;
}
