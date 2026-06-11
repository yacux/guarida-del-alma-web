import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Definimos las rutas públicas
const isPublicRoute = createRouteMatcher([
  "/", // 💡 ¡Clave! Si tenés una landing page o inicio pública
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)", // Perfecto para los webhooks de Clerk o Mercado Pago
]);

export default clerkMiddleware(async (auth, request) => {
  // 2. Si no es una ruta pública, protegemos
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  // Este matcher le dice a Next.js que ejecute el middleware en TODO,
  // menos en archivos estáticos (imágenes, fuentes, css)
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
