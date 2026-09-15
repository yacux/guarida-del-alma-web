// ============================================================
// src/application/use-cases/get-workshop-page/GetWorkshopPageUseCase.output.dto.ts
// ============================================================
import type { Workshop } from "@/core/entities/Product";
import type { Announcement } from "@/core/entities/Announcement";
import type { ModuleResourceType } from "@/core/entities/Module";
import type { UUID } from "@/core/entities/shared";

export interface ResolvedWorkshopResource {
  id: UUID;
  title: string;
  resourceType: ModuleResourceType; //lo tengo como module porque es el mismo que los recursos de los modulos de los cursos, pero en realidad es un recurso de workshop
  url: string | null;
  durationSeconds: number | null;
  orderIndex: number;
}

export interface GetWorkshopPageOutput {
  workshop: Workshop;
  resources: ResolvedWorkshopResource[];
  announcements: Announcement[];
}
