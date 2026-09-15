// src/app/(dashboard)/aula-virtual/perfil/page.tsx
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseProfileRepository } from "@/infrastructure/repositories";
import { GetStudentProfileUseCase } from "@/application/use-cases/get-student-profile/get-student-profile.use-case";
import { ProfileContent } from "./_components/ProfileContent";
import { auth } from "@clerk/nextjs/server";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("No autenticado.");
  }

  const supabase = await createSupabaseServerClient();

  const repository = new SupabaseProfileRepository(supabase);

  const useCase = new GetStudentProfileUseCase(repository);

  const profile = await useCase.execute({
    userId,
  });

  return <ProfileContent profile={profile} />;
}
