// ============================================================
// src/core/repositories/IWorkshopRepository.ts
// ============================================================

import type { WorkshopResource } from "../entities/Module";
import type { UUID } from "../entities/shared";

export interface IWorkshopRepository {
  findResourcesByProductId(productId: UUID): Promise<WorkshopResource[]>;
}
