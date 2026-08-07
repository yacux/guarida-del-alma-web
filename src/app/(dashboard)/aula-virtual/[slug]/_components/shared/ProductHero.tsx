// src/app/(dashboard)/aula-virtual/[slug]/_components/shared/ProductHero.tsx

import type { ProductType } from "@/core/entities/shared";

const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  course: "Curso",
  workshop: "Taller",
  program: "Programa",
};

interface ProductHeroProps {
  name: string;
  shortDescription: string | null;
  coverImageUrl: string | null;
  productType: ProductType;
}

export function ProductHero({
  name,
  shortDescription,
  coverImageUrl,
  productType,
}: ProductHeroProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
      <div className="w-full bg-linear-to-br from-muted to-muted-foreground/20" />
      {/* Overlay con el texto */}
      <div className="flex flex-col justify-end bg-linear-to-t from-guarida-violet/70 via-guarida-violet/20 to-transparent p-4">
        <span className="mb-2 inline-block w-fit rounded-full bg-guarida-sky text-guarida-violet px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
          {PRODUCT_TYPE_LABEL[productType]}
        </span>
        <h1 className="text-2xl font-bold text-white md:text-4xl">{name}</h1>
        {shortDescription && (
          <p className="mt-1 text-sm text-white/80 md:text-base">
            {shortDescription}
          </p>
        )}
      </div>
    </div>
  );
}
