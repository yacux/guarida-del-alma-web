// src/core/auth/can.ts
import { rolePermissions } from "./rolePermissions";
import type { UserRole } from "@/core/entities/shared";
import type { Permission } from "./permission";

// Función pura. Sin efectos secundarios. Sin React. Sin Next.js.
// Testeable con un simple: expect(can('admin', Permission.ManageProducts)).toBe(true)
export function can(
  role: UserRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}
