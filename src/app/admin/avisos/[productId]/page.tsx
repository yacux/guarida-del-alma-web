// ============================================================
// src/app/admin/avisos/[productId]/page.tsx
// ============================================================

import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseAnnouncementRepository } from "@/infrastructure/repositories/supabase-announcement.repository";
import { SupabaseProductRepository } from "@/infrastructure/repositories/supabase-product.repository";
import { AnnouncementForm } from "./_components/AnnouncementForm";
import { TogglePinButton } from "./_components/TogglePinButton"; // 👈 Importamos el botón cliente

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function AvisosProductPage({ params }: Props) {
  const { productId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();

  // 1. Instanciamos ambos repositorios
  const productRepo = new SupabaseProductRepository(client);
  const announcementRepo = new SupabaseAnnouncementRepository(client);

  // 2. Ejecutamos las dos búsquedas en paralelo con Promise.all
  const [product, announcements] = await Promise.all([
    productRepo.findById(productId),
    announcementRepo.findByProductId(productId),
  ]);

  // Si el producto no existe en la base de datos, mostramos 404
  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Avisos para: {product.name}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Publicá y gestioná las novedades enviadas a este producto.
        </p>
      </div>

      <AnnouncementForm productId={productId} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-white/50">Avisos anteriores</h2>
        {announcements.length === 0 ? (
          <p className="text-xs text-white/30">
            Aún no hay avisos para este producto.
          </p>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-guarida-dark-violet p-4"
            >
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white">
                  {a.isPinned && "📌 "}
                  {a.title}
                </p>
                <p className="mt-1 text-sm text-white/60">{a.content}</p>
                <p className="mt-2 text-xs text-white/30">
                  {new Date(a.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>

              {/* 👈 Agregamos el botón para alternar el fijado */}
              <TogglePinButton
                announcementId={a.id}
                isPinned={a.isPinned}
                productId={productId}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
