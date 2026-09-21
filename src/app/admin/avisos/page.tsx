// src/app/admin/avisos/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseProductRepository } from "@/infrastructure/repositories/supabase-product.repository";
import { GetActiveProductsUseCase } from "@/application/use-cases/get-active-products/GetActiveProductsUseCase";

const TYPE_LABEL = {
  course: "Curso",
  workshop: "Taller",
  program: "Programa",
} as const;

export default async function AvisosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();
  const products = await new GetActiveProductsUseCase(
    new SupabaseProductRepository(client),
  ).execute();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Publicar aviso</h1>
        <p className="mt-1 text-sm text-white/50">
          Elegí a qué producto va dirigido.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/admin/avisos/${p.id}`}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-guarida-dark-violet p-4 transition-all hover:border-white/15"
          >
            <span className="text-sm font-medium text-white">{p.name}</span>
            <span className="text-xs text-white/40">
              {TYPE_LABEL[p.productType]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
