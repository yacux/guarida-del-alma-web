import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Crea un cliente de Supabase autenticado con el contexto de la alumna actual.
 * Se utiliza estrictamente en el entorno del servidor (Server Components, Server Actions y API Routes).
 */
export async function createSupabaseServerClient() {
  // 1. Obtenemos el control de la sesión de Clerk en el servidor.
  const { getToken } = await auth();

  // 2. Solicitamos el token JWT que Clerk generó específicamente para Supabase.
  // con este jwt vamos a poder entrar a supabase y mostrarle para que sepa quien es el alumno. en base a eso supabase me mostrara su data.
  // Nota: Requiere haber configurado la integración (JWT Template) en el dashboard de Clerk con el nombre 'supabase'
  const token = await getToken({ template: "supabase" });

  // 3. Retornamos el cliente de Supabase inyectando el token en las cabeceras globales
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Si no existe token, no enviar el header.
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    },
  );
}
