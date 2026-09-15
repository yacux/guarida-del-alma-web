// ============================================================
// src/app/(dashboard)/aula-virtual/components/program/ProgramContent.tsx
//
// Compositor visual del programa. Orquesta todas las secciones.
// No tiene lógica de negocio: recibe datos y delega a secciones.
// ============================================================

import type { Program } from "@/core/entities/Product";
import type { Product } from "@/core/entities/Product";
import type { Announcement } from "@/core/entities/Announcement";

import { ProductHero } from "../shared/ProductHero";
import { WelcomeVideo } from "../shared/WelcomeVideo";
import { EmptyState } from "../shared/EmptyState";
import { QuickActionsSection } from "./sections/QuickActionsSection";
import { IncludedProductsGrid } from "./IncludedProductsGrid";
import { AnnouncementSection } from "./sections/AnnouncementSection";
import type { UpcomingSessionItem } from "../cards/SessionCard";

interface ProgramContentProps {
  program: Program;
  includedProducts: Product[];
  announcements: Announcement[];
  allAnnouncementsHref?: string;
  remainingSessions?: number;
  totalSessions?: number;
  upcomingSessions?: UpcomingSessionItem[]; // ← se mantiene el prop, cambia destino
  certificateAvailable?: boolean;
  bookingUrl?: string;
  certificateUrl?: string;
  upcomingLive?: {
    productName: string;
    productType: "workshop" | "course" | "program";
    startsAt: string;
    href: string;
  };
}

export function ProgramContent({
  program,
  includedProducts,
  announcements,
  allAnnouncementsHref,
  remainingSessions,
  totalSessions,
  upcomingSessions,
  certificateAvailable = false,
  bookingUrl,
  certificateUrl,
  upcomingLive,
}: ProgramContentProps) {
  const { programDetails } = program;

  const sessions = totalSessions ?? programDetails.individualSessionsCount;
  const sessionsLeft =
    remainingSessions ?? programDetails.individualSessionsCount;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* 1. Hero */}
      <ProductHero
        name={program.name}
        shortDescription={program.shortDescription}
        coverImageUrl={program.coverImageUrl}
        productType="program"
      />

      {/* 2. Anuncio destacado — solo si hay anuncios */}
      <AnnouncementSection
        announcements={announcements}
        allAnnouncementsHref={allAnnouncementsHref}
      />

      {/* 3. Accesos y acciones rápidas */}
      <QuickActionsSection
        remainingSessions={sessionsLeft}
        totalSessions={sessions}
        upcomingSessions={upcomingSessions}
        certificateAvailable={certificateAvailable}
        totalIncludedProducts={includedProducts.length}
        whatsappCommunityUrl={program.whatsappCommunityUrl ?? undefined}
        productId={program.id}
        slug={program.slug}
        certificateUrl={certificateUrl}
        upcomingLive={upcomingLive}
      />

      {/* 4. Video de bienvenida */}
      <WelcomeVideo welcomeVideoUrl={program.welcomeVideoUrl} />

      {/* 5. productos incluidos del programa (contenido) */}
      <section>
        <h2 className="mb-1 text-xl font-semibold text-white">
          Contenido del programa
        </h2>
        <p className="mb-4 text-sm text-white/50">
          Accedé a todos los cursos y talleres incluidos en tu programa.
        </p>

        {includedProducts.length > 0 ? (
          <IncludedProductsGrid products={includedProducts} />
        ) : (
          <EmptyState
            title="Aún no hay contenido asignado"
            description="Los cursos y talleres estarán disponibles pronto."
          />
        )}
      </section>
    </div>
  );
}
