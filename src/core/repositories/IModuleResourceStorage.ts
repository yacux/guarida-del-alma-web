// ============================================================
// src/core/repositories/IModuleResourceStorage.ts
//
// Contrato para resolver recursos privados (PDF, audio) a URLs
// temporales consumibles por el navegador.
// ============================================================

export interface IModuleResourceStorage {
  /**
   * Genera una URL temporal (Signed URL) para un objeto privado.
   *
   * @param storagePath - Path del objeto, ej: "courses/amor-propio/modules/2/guia.pdf"
   * @param expiresInSeconds - TTL de la URL. Default: 3600 (1 hora).
   */

  createSignedUrl(
    storagePath: string,
    expiresInSeconds?: number,
  ): Promise<string>;
}
