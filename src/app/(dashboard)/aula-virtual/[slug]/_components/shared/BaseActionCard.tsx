// ============================================================
// src/app/(dashboard)/aula-virtual/_components/shared/BaseActionCard.tsx
//
// Card base para las acciones del Aula Virtual.
//
// Responsabilidad:
//
// - Layout
// - Espaciado
// - Colores base
// - Icono
// - Footer
//
// No conoce el dominio.
// ============================================================

import type { ReactNode } from "react";
import clsx from "clsx";

interface BaseActionCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function BaseActionCard({
  title,
  icon,
  children,
  footer,
  className,
}: BaseActionCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl p-5 text-white border border-guarida-violet/20 bg-guarida-dark-violet/60">
      {/* Icono */}

      <div className="flex justify-start gap-3 items-center">
        <div
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            className,
          )}
        >
          {icon}
        </div>

        <h4 className="text-sm font-medium text-white/80">{title}</h4>
      </div>

      {/* Contenido */}

      <div className="mt-5 flex flex-1 flex-col">{children}</div>

      {/* Acción */}

      {footer && <div className="mt-4">{footer}</div>}
    </article>
  );
}
