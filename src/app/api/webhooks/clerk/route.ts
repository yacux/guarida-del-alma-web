//src/app/api/webhooks/clerk/route.ts
{
  /*
    En Clean Architecture, los endpoints de la API son meros "mecanismos de entrega" 
    (Delivery Mechanisms). Su única responsabilidad es recibir la petición HTTP, 
    verificar que sea segura y pasarle la pelota al Caso de Uso.
    Gracias a que Claude dejó el tipo ClerkWebhookUserPayload dentro de la entidad, 
    podemos indicarle a TypeScript exactamente qué datos está manejando el webhook.
*/
}
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ClerkWebhookUserPayload } from "@/core/entities/Profile";
import { CreateProfileUseCase } from "@/application/use-cases/create-profile/CreateProfileUseCase";
import { SupabaseProfileRepository } from "@/infrastructure/repositories/SupabaseProfileRepository";

export async function POST(req: Request) {
  console.log("¡Webhook recibido en el servidor!");
  // 1. Validamos que el secreto del webhook exista en las variables de entorno
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Falta la variable CLERK_WEBHOOK_SECRET en el .env");
  }

  // 2. Extraemos los headers de seguridad que envía Clerk (vía Svix)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Si falta alguno, la petición es sospechosa y la rechazamos
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Faltan headers de verificación Svix", {
      status: 400,
    });
  }

  // 3. Obtenemos el cuerpo crudo (body) de la petición para validar la firma
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  // 4. Verificación criptográfica: Asegura que la petición viene REALMENTE de Clerk y nadie alteró el payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Firma del webhook inválida:", err);
    return new Response("Error: Firma inválida", { status: 400 });
  }

  // 5. Procesamos el evento una vez que sabemos que es 100% seguro
  if (evt.type === "user.created") {
    // Inyección de Dependencias manual:
    // Creamos el "albañil" (infraestructura) y se lo entregamos al "orquestador" (caso de uso)
    // es decir instanciamos un repositorio concreto (SupabaseProfileRepository),
    // tambien instanciamos el caso de uso (CreateProfileUseCase),
    // al que le pasamos el repositorio concreto (SupabaseProfileRepository) para que lo use internamente.
    // el repositorio concreto (SupabaseProfileRepository) es el que se encarga de los detalles de cómo se guardan los datos.
    const profileRepository = new SupabaseProfileRepository();
    const createProfileUseCase = new CreateProfileUseCase(profileRepository);

    try {
      // Forzamos el tipado al payload específico que Claude definió en tu entidad Profile
      const clerkUserPayload = evt.data as unknown as ClerkWebhookUserPayload;

      // Ejecutamos la lógica de negocio pura
      await createProfileUseCase.execute(clerkUserPayload);

      console.log(
        `[Webhook] Perfil creado y sincronizado con éxito para el ID: ${clerkUserPayload.id}`,
      );
    } catch (error) {
      console.error("[Webhook] Error en la ejecución del Caso de Uso:", error);
      return new Response("Error interno procesando el perfil", {
        status: 500,
      });
    }
  }

  // Cumplimos con responderle un 200 OK a Clerk para decirle "recibido"
  return new Response("Webhook procesado", { status: 200 });
}
