// ============================================================
// src/app/admin/alumnos/page.tsx
// ============================================================
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseProfileRepository } from "@/infrastructure/repositories/supabase-profile.repository";
import { GetStudentsListUseCase } from "@/application/use-cases/get-students-list/GetStudentsListUseCase";

export default async function AlumnosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();
  const students = await new GetStudentsListUseCase(
    new SupabaseProfileRepository(client),
  ).execute();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-white">
        Cantidad de Alumnos: {students.length}
      </h1>

      <div className="flex flex-col gap-2">
        {students.map((s) => (
          <Link
            key={s.id}
            href={`/admin/alumnos/${s.id}`}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-guarida-dark-violet p-4 transition-all hover:border-white/15"
          >
            <div>
              <p className="text-sm font-medium text-white">{s.username}</p>
              <p className="text-xs text-white/40">{s.email}</p>
            </div>
            <span className="text-xs text-white/30">
              alumno desde: {new Date(s.createdAt).toLocaleDateString("es-AR")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
