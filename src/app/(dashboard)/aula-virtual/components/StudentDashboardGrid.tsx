// ============================================================
// StudentDashboardGrid
//
// Componente de presentación.
// Su única responsabilidad es renderizar una grilla de cards.
//
// No contiene lógica de negocio.
// No conoce Clerk.
// No conoce Supabase.
// No conoce Casos de Uso.
//
// Recibe DTOs ya preparados por GetStudentDashboardUseCase.
// ============================================================

import type { StudentDashboardItem } from "@/application/use-cases/get-student-dashboard/studentDashboardDto";

import StudentDashboardCard from "./StudentDashboardCard";

interface StudentDashboardGridProps {
  items: StudentDashboardItem[];
}

export default function StudentDashboardGrid({
  items,
}: StudentDashboardGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-guarida-sky/20 bg-guarida-dark-violet p-8 text-center">
        <h2 className="text-xl font-semibold text-white">
          Todavía no tenés formaciones activas
        </h2>

        <p className="mt-2 text-zinc-400">
          Cuando adquieras un curso, taller o programa aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <StudentDashboardCard key={item.productId} item={item} />
      ))}
    </div>
  );
}
