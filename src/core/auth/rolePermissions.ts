// src/core/auth/rolePermissions.ts
import { Permission } from "./permission";
import type { UserRole } from "@/core/entities/shared";

// Con solo 2 roles la tabla es simple.
// Si en el futuro agregás 'moderator' o 'teacher_assistant',
// solo agregás una entrada aquí. El resto del código no cambia.
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: Object.values(Permission), // admin tiene todo

  student: [
    Permission.ViewProducts,
    Permission.SubmitAssignments,
    Permission.ViewOwnEnrollments,
    Permission.BookSessions,
  ],
};

export { rolePermissions };
