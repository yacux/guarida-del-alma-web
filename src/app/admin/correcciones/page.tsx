// ============================================================
// src/app/(admin)/correcciones/page.tsx
// ============================================================

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseSubmissionRepository } from "@/infrastructure/repositories/supabase-submission.repository";
import { GetPendingSubmissionsUseCase } from "@/application/use-cases/get-pending-submissions/GetPendingSubmissionsUseCase";
import { SubmissionQueueList } from "./_components/SubmissionQueueList";

export default async function CorreccionesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();

  const { items } = await new GetPendingSubmissionsUseCase(
    new SupabaseSubmissionRepository(client),
  ).execute();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Correcciones pendientes
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {items.length === 0
            ? "No hay entregas esperando corrección."
            : `${items.length} ${items.length === 1 ? "entrega espera" : "entregas esperan"} tu revisión.`}
        </p>
      </div>

      <SubmissionQueueList items={items} />
    </div>
  );
}
