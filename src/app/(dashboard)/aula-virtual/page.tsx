// src/app/aula-virtual/page.tsx
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseEnrollmentRepository } from "@/infrastructure/repositories/SupabaseEnrollmentRepository";
import { SupabaseProductRepository } from "@/infrastructure/repositories/SupabaseProductRepository";
import { GetStudentDashboardUseCase } from "@/application/use-cases/get-student-dashboard/getStudentDashboardUseCase";
import StudentDashboardGrid from "./components/StudentDashboardGrid";

export default async function AulaVirtualPage() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Usuario no autenticado");
  }

  // creo un cliente normal de supabase.
  const supabase = await createSupabaseServerClient();

  // creo los repositorios necesarios para el caso de uso.
  // les paso el cliente de supabase para que ellos puedan hacer las consultas a la base de datos. sin cliente no pueden hacer nada.
  const enrollmentRepository = new SupabaseEnrollmentRepository(supabase);
  const productRepository = new SupabaseProductRepository(supabase);

  // instancio el caso de uso. le inyecto los repositorios
  const getStudentDashboardUseCase = new GetStudentDashboardUseCase(
    enrollmentRepository,
    productRepository,
  );

  // ejecuto el caso de uso. le paso el id del usuario autenticado.
  const dashboardItems = await getStudentDashboardUseCase.execute({
    studentId: userId,
  });

  // renderizo la vista. por ahora solo muestro el nombre de los productos que tiene el usuario.
  return <StudentDashboardGrid items={dashboardItems} />;
}
