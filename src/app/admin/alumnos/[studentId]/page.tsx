// ============================================================
// src/app/admin/alumnos/[studentId]/page.tsx
// ============================================================
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseProfileRepository } from "@/infrastructure/repositories/supabase-profile.repository";
import { SupabaseEnrollmentRepository } from "@/infrastructure/repositories/supabase-enrollment.repository";
import { GetStudentDetailUseCase } from "@/application/use-cases/get-student-detail/GetStudentDetailUseCase";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { studentId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();
  const result = await new GetStudentDetailUseCase(
    new SupabaseProfileRepository(client),
    new SupabaseEnrollmentRepository(client),
  ).execute(studentId);

  if (!result) notFound();
  const { profile, enrollments } = result;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-white">{profile.username}</h1>
        <p className="text-sm text-white/50">{profile.email}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-white/50">Matrículas</h2>
        {enrollments.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-guarida-dark-violet p-4"
          >
            <div>
              <p className="text-sm text-white">{e.productId}</p>
              <p className="text-xs text-white/40">
                Vence: {new Date(e.expiresAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${e.status === "active" ? "bg-guarida-sky/10 text-guarida-sky" : "bg-red-500/10 text-red-400"}`}
            >
              {e.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
