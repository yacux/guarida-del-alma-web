// ============================================================
// src/app/(dashboard)/aula-virtual/[slug]/_actions/sessionActions.ts
// ============================================================

"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseStudentSessionsRepository } from "@/infrastructure/repositories/supabase-student-sessions.repository";
import { CalComAdapter } from "@/infrastructure/adapters/CalComAdapter";
import { GetAvailableSlotsUseCase } from "@/application/use-cases/get-available-slots/GetAvailableSlotsUseCase";
import { CreateSessionBookingUseCase } from "@/application/use-cases/create-session-booking/CreateSessionBookingUseCase";
import type { AvailableDayDTO } from "@/application/use-cases/get-available-slots/GetAvailableSlotsUseCase.output.dto";
import type { CreateSessionBookingOutputDTO } from "@/application/use-cases/create-session-booking/CreateSessionBookingUseCase.output.dto";
import { revalidatePath } from "next/cache";

export async function fetchAvailableSlots(params: {
  startDate: string;
  endDate: string;
  timeZone: string;
}): Promise<AvailableDayDTO[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado.");

  return new GetAvailableSlotsUseCase(new CalComAdapter()).execute(params);
}

export async function bookSession(params: {
  productId: string;
  slug: string;
  start: string;
  timeZone: string;
}): Promise<CreateSessionBookingOutputDTO> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado.");

  // Nombre y email salen de Clerk — la alumna nunca los tipea.
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const name = user?.fullName ?? user?.firstName ?? "Alumna";

  if (!email) {
    return {
      outcome: "calendar_error",
      error: "No se encontró tu email en la cuenta.",
    };
  }

  const client = await createSupabaseServerClient();

  const result = await new CreateSessionBookingUseCase(
    new SupabaseStudentSessionsRepository(client),
    new CalComAdapter(),
  ).execute({
    studentId: userId,
    productId: params.productId,
    start: params.start,
    attendeeName: name,
    attendeeEmail: email,
    attendeeTimeZone: params.timeZone,
  });

  // El webhook descuenta la sesión de forma asíncrona; refrescamos
  // para que el balance se actualice apenas vuelva la alumna.
  if (result.outcome === "created") {
    revalidatePath(`/aula-virtual/${params.slug}`);
  }

  return result;
}
