// ============================================================
// src/application/use-cases/get-workshop-page/GetWorkshopPageUseCase.ts
// ============================================================
import type { IProductDetailsRepository } from "@/core/repositories/IProductDetailsRepository";
import type { IWorkshopRepository } from "@/core/repositories/IWorkshopRepository";
import type { IAnnouncementRepository } from "@/core/repositories/IAnnouncementRepository";
import type { IModuleResourceStorage } from "@/core/repositories/IModuleResourceStorage";
import type { WorkshopResource } from "@/core/entities/Module";
import { isWorkshop } from "@/core/entities/Product";
import {
  GetWorkshopPageOutput,
  type ResolvedWorkshopResource,
} from "./GetWorkshopPageUseCase.output.dto";
import { GetWorkshopPageInput } from "./GetWorkshopPageUseCase.input.dto";

export class GetWorkshopPageUseCase {
  constructor(
    private readonly productDetailsRepository: IProductDetailsRepository,
    private readonly workshopRepository: IWorkshopRepository,
    private readonly announcementRepository: IAnnouncementRepository,
    private readonly resourceStorage: IModuleResourceStorage,
  ) {}

  async execute(
    input: GetWorkshopPageInput,
  ): Promise<GetWorkshopPageOutput | null> {
    const variant = await this.productDetailsRepository.findBySlug(
      input.workshopSlug,
    );
    if (!variant) return null;
    if (!isWorkshop(variant)) return null;

    const [rawResources, announcements] = await Promise.all([
      this.workshopRepository.findResourcesByProductId(variant.id),
      this.announcementRepository.findByProductId(variant.id),
    ]);

    const resources = await this.resolveResourceUrls(rawResources);

    return { workshop: variant, resources, announcements };
  }

  private async resolveResourceUrls(
    rawResources: WorkshopResource[],
  ): Promise<ResolvedWorkshopResource[]> {
    return Promise.all(
      rawResources.map(async (r) => {
        const needsSignedUrl =
          r.resourceType === "pdf" || r.resourceType === "audio";
        const url =
          needsSignedUrl && r.storagePath
            ? await this.resourceStorage.createSignedUrl(r.storagePath)
            : r.url;

        return {
          id: r.id,
          title: r.title,
          resourceType: r.resourceType,
          url,
          durationSeconds: r.durationSeconds,
          orderIndex: r.orderIndex,
        };
      }),
    );
  }
}
