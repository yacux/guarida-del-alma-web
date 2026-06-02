// ============================================================
// src/core/entities/Profile.ts
// Perfil de usuario gestionado por Clerk.
//
// [CAMBIO] id es ClerkUserId (string), NO UUID.
//   Formato: "user_2abc123xyz"
//   El perfil se crea vía webhook de Clerk → API Route de Next.js,
//   NO mediante un trigger de Supabase sobre auth.users.
// ============================================================

import type { ClerkUserId, ISODateString, UserRole } from './shared';

export interface Profile {
  /** Clerk User ID. Formato: "user_2abc123xyz". PK en public.profiles. */
  id: ClerkUserId;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  /** 'student' = alumna | 'admin' = Hebe */
  role: UserRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Payload que llega desde el webhook de Clerk (evento "user.created").
 * La API Route lo usa para crear el perfil en Supabase.
 */
export type ClerkWebhookUserPayload = {
  id: ClerkUserId;
  email_addresses: Array<{ email_address: string; primary: boolean }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

/** Campos editables por la propia alumna desde su panel de perfil */
export type UpdateProfileInput = Partial<
  Pick<Profile, 'fullName' | 'avatarUrl' | 'phone'>
>;

/** Helper: construir fullName desde payload de Clerk */
export const buildFullName = (p: ClerkWebhookUserPayload): string =>
  [p.first_name, p.last_name].filter(Boolean).join(' ');