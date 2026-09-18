// ============================================================
// src/app/(dashboard)/aula-virtual/_components/workshop/WorkshopContent.tsx
// ============================================================

import type { Workshop } from "@/core/entities/Product";
import type { Announcement } from "@/core/entities/Announcement";
import type { ResolvedWorkshopResource } from "@/application/use-cases/get-workshop-page/GetWorkshopPageUseCase.output.dto";
import { ProductHero } from "../shared/ProductHero";
import { WelcomeVideo } from "../shared/WelcomeVideo";
import { AnnouncementSection } from "../program/sections/AnnouncementSection";
import { WorkshopResourcesSection } from "./WorkshopResourcesSection";

interface Props {
  workshop: Workshop;
  resources: ResolvedWorkshopResource[];
  announcements: Announcement[];
  allAnnouncementsHref?: string;
}

export function WorkshopContent({
  workshop,
  resources,
  announcements,
  allAnnouncementsHref,
}: Props) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <ProductHero
        name={workshop.name}
        shortDescription={workshop.shortDescription}
        coverImageUrl={workshop.coverImageUrl}
        productType="workshop"
      />

      {/* <LastLivesSection /> */}

      <AnnouncementSection
        announcements={announcements}
        allAnnouncementsHref={allAnnouncementsHref}
      />

      <WelcomeVideo welcomeVideoUrl={workshop.welcomeVideoUrl} />

      <WorkshopResourcesSection resources={resources} />
    </div>
  );
}
