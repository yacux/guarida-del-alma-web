// src/app/(dashboard)/aula-virtual/[slug]/_components/program/ProgramProductCard.tsx
import Link from "next/link";
import type { Product } from "@/core/entities/Product";
import type { ProductType } from "@/core/entities/shared";
import { ChevronRight } from "lucide-react";

const TYPE_LABEL: Record<ProductType, string> = {
  course: "Curso",
  workshop: "Taller",
  program: "Programa",
};

const TYPE_BADGE_CLASS: Record<ProductType, string> = {
  course: "bg-guarida-sky",
  workshop: "bg-guarida-fuchsia/60",
  program: "bg-guarida-violet/50",
};

interface ProgramProductCardProps {
  product: Product;
  // futuro: progress?: { completedModules: number; totalModules: number }
  // futuro: isCompleted?: boolean
}

export function ProgramProductCard({ product }: ProgramProductCardProps) {
  return (
    <Link
      href={`/aula-virtual/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card border-guarida-sky/20 transition-shadow hover:shadow-md"
    >
      {/* Imagen de portada */}
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        {product.coverImageUrl ? (
          <img
            src={product.coverImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-muted to-muted-foreground/10" />
        )}
      </div>

      {/* Contenido */}
      <div className="bg-white/94 hover:bg-white text-guarida-violet flex flex-1 flex-col gap-2 p-4">
        {/* Badge de tipo */}
        <span
          className={`inline-block w-fit rounded-full px-2 text-xs font-medium text-white ${TYPE_BADGE_CLASS[product.productType]}`}
        >
          {TYPE_LABEL[product.productType]}
        </span>

        {/* Nombre */}
        <h3 className="font-semibold leading-snug">{product.name}</h3>

        {/* Descripción corta */}
        {product.shortDescription && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>
        )}

        {/* futuro: barra de progreso */}
        {/* {progress && (
          <ProgressBar
            completed={progress.completedModules}
            total={progress.totalModules}
          />
        )} */}

        {/* CTA */}
        <div className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-primary">
          <span>Ir al contenido</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
