// ============================================================
// src/application/use-cases/create-announcement/CreateAnnouncementUseCase.ts
// ============================================================
import type { IAnnouncementRepository } from "@/core/repositories/IAnnouncementRepository";
import type { CreateAnnouncementInputDto } from "@/application/use-cases/create-announcement/CreateAnnouncementUseCase.input.dto";
import type { CreateAnnouncementOutput } from "@/application/use-cases/create-announcement/CreateAnnouncementUseCase.output.dto";

export class CreateAnnouncementUseCase {
  constructor(
    private readonly announcementRepository: IAnnouncementRepository,
  ) {}

  async execute(
    input: CreateAnnouncementInputDto,
  ): Promise<CreateAnnouncementOutput> {
    if (!input.title.trim()) return { success: false, reason: "empty_title" };
    if (!input.content.trim())
      return { success: false, reason: "empty_content" };

    const announcement = await this.announcementRepository.create({
      productId: input.productId,
      meetingId: null,
      authorId: input.authorId,
      title: input.title.trim(),
      content: input.content.trim(),
      isPinned: input.isPinned,
    });

    return { success: true, announcement };
  }
}
