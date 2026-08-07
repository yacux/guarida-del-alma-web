// src/app/(dashboard)/aula-virtual/[slug]/_components/program/IncludedProductsGrid.tsx

import type { Product } from "@/core/entities/Product";
import { ProgramProductCard } from "./ProgramProductCard";

interface IncludedProductsGridProps {
  products: Product[];
  // futuro: progressByProductId?: Record<UUID, ModuleProgress[]>
}

export function IncludedProductsGrid({ products }: IncludedProductsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProgramProductCard
          key={product.id}
          product={product}
          // futuro: progress={progressByProductId?.[product.id]}
        />
      ))}
    </div>
  );
}
