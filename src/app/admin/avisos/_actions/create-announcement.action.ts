// ============================================================
// src/app/admin/avisos/_actions/create-announcement.action.ts
// ============================================================
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseAnnouncementRepository } from "@/infrastructure/repositories/supabase-announcement.repository";
import { CreateAnnouncementUseCase } from "@/application/use-cases/create-announcement/CreateAnnouncementUseCase";
import type { CreateAnnouncementOutput } from "@/application/use-cases/create-announcement/CreateAnnouncementUseCase.output.dto";
import type { UUID } from "@/core/entities/shared";

export async function createAnnouncementAction(params: {
  productId: UUID;
  title: string;
  content: string;
  isPinned: boolean;
}): Promise<CreateAnnouncementOutput> {
  const { userId } = await auth();
  if (!userId) return { success: false, reason: "empty_title" };

  const client = await createSupabaseServerClient();
  const result = await new CreateAnnouncementUseCase(
    new SupabaseAnnouncementRepository(client),
  ).execute({ ...params, authorId: userId });

  if (result.success) {
    revalidatePath(`/admin/avisos/${params.productId}`);
  }
  return result;
}
