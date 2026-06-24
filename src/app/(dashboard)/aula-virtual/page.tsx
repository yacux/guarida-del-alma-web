// src/app/aula-virtual/page.tsx
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseEnrollmentRepository } from "@/infrastructure/repositories/SupabaseEnrollmentRepository";
import { SupabaseProductRepository } from "@/infrastructure/repositories/SupabaseProductRepository";
import { GetStudentDashboardUseCase } from "@/application/use-cases/get-student-dashboard/getStudentDashboardUseCase";

export default async function AulaVirtualPage() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Usuario no autenticado");
  }

  const supabase = await createSupabaseServerClient();

  const enrollmentRepository = new SupabaseEnrollmentRepository(supabase);
  const productRepository = new SupabaseProductRepository(supabase);

  const getStudentDashboardUseCase = new GetStudentDashboardUseCase(
    enrollmentRepository,
    productRepository,
  );

  const dashboardItems = await getStudentDashboardUseCase.execute({
    studentId: userId,
  });

  return (
    <div>
      {dashboardItems.map((item) => (
        <div key={item.productId}>{item.name}</div>
      ))}
    </div>
  );
}
