// ============================================================
// StudentDashboardCard
//
// Card visual de una formación.
//
// Solo renderiza información.
// No realiza consultas.
// No contiene lógica de negocio.
//
// Consume StudentDashboardItem (DTO).
// ============================================================

import Link from "next/link";

import type { StudentDashboardItem } from "@/application/use-cases/get-student-dashboard/studentDashboardDto";

interface StudentDashboardCardProps {
  item: StudentDashboardItem;
}

export default function StudentDashboardCard({
  item,
}: StudentDashboardCardProps) {
  const badgeLabel =
    item.productType === "program"
      ? "Programa"
      : item.productType === "course"
        ? "Curso"
        : "Taller";

  return (
    <Link
      href={`/aula-virtual/${item.slug}`}
      className="
        group
        overflow-hidden
        rounded-2xl
        border
        border-guarida-sky/15
        bg-guarida-dark-violet
        transition-all
        hover:border-guarida-fuchsia/40
        hover:-translate-y-1
      "
    >
      {/* Imagen */}
      <div className="relative h-48 overflow-hidden bg-guarida-dark">
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt={item.name}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-105
            "
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Sin portada
          </div>
        )}

        <span
          className="
            absolute
            left-3
            top-3
            rounded-full
            bg-guarida-fuchsia
            px-3
            py-1
            text-xs
            font-semibold
            text-white
          "
        >
          {badgeLabel}
        </span>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <h3 className="line-clamp-2 text-lg font-semibold text-white">
          {item.name}
        </h3>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-zinc-400">Progreso</span>

            <span className="font-medium text-white">
              {item.progressPercentage}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-guarida-dark">
            <div
              className="h-full rounded-full bg-guarida-sky transition-all"
              style={{
                width: `${item.progressPercentage}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Acceso hasta</p>

            <p className="text-sm text-zinc-300">
              {new Date(item.expiresAt).toLocaleDateString("es-AR")}
            </p>
          </div>

          {item.isExpired ? (
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300">
              Expirado
            </span>
          ) : (
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
              Activo
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
