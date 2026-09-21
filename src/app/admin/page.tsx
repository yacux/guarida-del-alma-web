// src/app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseSubmissionRepository } from "@/infrastructure/repositories/supabase-submission.repository";
import { GetPendingSubmissionsUseCase } from "@/application/use-cases/get-pending-submissions/GetPendingSubmissionsUseCase";

export default async function AdminOverviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();
  const { items } = await new GetPendingSubmissionsUseCase(
    new SupabaseSubmissionRepository(client),
  ).execute();

  const cards = [
    {
      href: "/admin/correcciones",
      label: "Correcciones pendientes",
      value: items.length,
    },
    { href: "/admin/avisos", label: "Publicar aviso", value: null },
    { href: "/admin/alumnos", label: "Ver alumnos", value: null },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-white">Panel de Hebe</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-white/5 bg-guarida-dark-violet p-5 transition-all hover:border-white/15"
          >
            <p className="text-sm text-white/60">{c.label}</p>
            {c.value !== null && (
              <p className="mt-2 text-2xl font-bold text-white">{c.value}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
