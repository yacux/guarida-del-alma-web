// ============================================================
// src/infrastructure/repositories/supabase-module-resource-storage.repository.ts
//
// Implementación concreta de IModuleResourceStorage.
// Genera Signed URLs temporales para objetos privados del
// bucket learning-resources (pdf/audio).
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IModuleResourceStorage } from "@/core/repositories/IModuleResourceStorage";

const BUCKET_NAME = "learning-resources";
const DEFAULT_EXPIRES_SECONDS = 3600; // 1 hora

export class SupabaseModuleResourceStorage implements IModuleResourceStorage {
  constructor(private readonly client: SupabaseClient) {}

  async createSignedUrl(
    storagePath: string,
    expiresInSeconds: number = DEFAULT_EXPIRES_SECONDS,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      throw new Error(
        `[SupabaseModuleResourceStorage] No se pudo generar la URL firmada ` +
          `para "${storagePath}": ${error?.message ?? "objeto no encontrado"}`,
      );
    }

    return data.signedUrl;
  }
}
