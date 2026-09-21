// ============================================================
// src/application/use-cases/create-announcement/CreateAnnouncementUseCase.input.dto.ts
// ============================================================
import type { UUID, ClerkUserId } from "@/core/entities/shared";

export interface CreateAnnouncementInputDto {
  productId: UUID;
  authorId: ClerkUserId;
  title: string;
  content: string;
  isPinned: boolean;
}
