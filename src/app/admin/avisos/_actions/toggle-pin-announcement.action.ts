"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";

export async function togglePinAnnouncementAction(
  announcementId: string,
  newPinnedState: boolean,
  productId: string,
) {
  const client = await createSupabaseServerClient();

  // Actualizamos directamente en Supabase (o llamando a tu repositorio)
  const { error } = await client
    .from("announcements")
    .update({ is_pinned: newPinnedState })
    .eq("id", announcementId);

  if (error) {
    throw new Error(
      `Error al actualizar el estado del aviso: ${error.message}`,
    );
  }

  // Refresca la vista automáticamente en la ruta del admin
  revalidatePath(`/admin/avisos/${productId}`);
}
