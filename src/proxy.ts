import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { can } from "@/core/auth/can";
import { Permission } from "@/core/auth/permission";

const isPublicRoute = createRouteMatcher([
  "/",
  "/cursos-talleres",
  "/login(.*)",
  "/registro(.*)",
  "/api/webhooks(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (isAdminRoute(request)) {
    const { sessionClaims, redirectToSignIn } = await auth();

    console.log("LA METADATA: ", sessionClaims?.metadata);

    // Por si acaso: sin sesión, no debería llegar hasta acá
    // (auth.protect() ya lo habría redirigido), pero se cubre igual.
    if (!sessionClaims) {
      console.log("NO HAY SESSION CLAIMS");
      return redirectToSignIn();
    }

    const role = sessionClaims?.metadata?.role;
    console.log("rol del PANA" + role);

    if (!can(role, Permission.ViewAdminDashboard)) {
      const dashboardUrl = new URL("/aula-virtual", request.url);
      return Response.redirect(dashboardUrl);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
