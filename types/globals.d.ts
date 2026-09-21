// ============================================================
// types/globals.d.ts
//
// Tipa sessionClaims.metadata.role en todo el proyecto.
// Requiere que el JWT template de Clerk incluya "metadata: {{user.public_metadata}}"
// (o el claim que corresponda) para que esto viaje realmente en el token.
// ============================================================

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "student" | "admin";
    };
  }
}
