// ============================================================
// src/application/use-cases/create-announcement/CreateAnnouncementUseCase.output.dto.ts
// ============================================================
import type { Announcement } from "@/core/entities/Announcement";

export type CreateAnnouncementOutput =
  | { success: true; announcement: Announcement }
  | { success: false; reason: "empty_title" | "empty_content" };
