import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";

import { SupabaseProfileRepository } from "@/infrastructure/repositories";

import { GetStudentProfileUseCase } from "@/application/use-cases/get-student-profile/get-student-profile.use-case";

import { ProfileContent } from "./_components/ProfileContent";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  const repository = new SupabaseProfileRepository(supabase);

  const useCase = new GetStudentProfileUseCase(repository);

  const profile = await useCase.execute();

  return <ProfileContent profile={profile} />;
}
