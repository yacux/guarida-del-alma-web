// src/app/(dashboard)/aula-virtual/[slug]/page.tsx
// ============================================================

import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { SupabaseProductRepository } from "@/infrastructure/repositories/supabase-product.repository";
import { SupabaseProductDetailsRepository } from "@/infrastructure/repositories/supabase-product-details.repository";
import { SupabaseAnnouncementRepository } from "@/infrastructure/repositories/supabase-announcement.repository";
import { SupabaseModuleRepository } from "@/infrastructure/repositories/supabase-module.repository";
import { SupabaseWorkshopRepository } from "@/infrastructure/repositories/supabase-workshop.repository";
import { SupabaseModuleResourceStorage } from "@/infrastructure/repositories/supabase-module-resource-storage.repository";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";

import { GetProgramPageUseCase } from "@/application/use-cases/get-program-page/GetProgramPageUseCase";
import { GetCoursePageUseCase } from "@/application/use-cases/get-course-page/GetCoursePageUseCase";

import { ProgramContent } from "./_components/program/ProgramContent";
import { CourseContent } from "./_components/course/CourseContent";
import { WorkshopContent } from "./_components/workshop/WorkshopContent";

import { GetWorkshopPageUseCase } from "@/application/use-cases/get-workshop-page/GetWorkshopPageUseCase";
import { GetUpcomingSessionsUseCase } from "@/application/use-cases/get-upcoming-sessions/GetUpcomingSessionsUseCase";
import { GetSessionBalanceUseCase } from "@/application/use-cases/get-session-balance/GetSessionBalanceUseCase";
import { SupabaseStudentSessionsRepository } from "@/infrastructure/repositories/supabase-student-sessions.repository";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AulaVirtualProductPage({ params }: Props) {
  const { slug } = await params;
  // ── Autenticación ──────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();

  // ── Resolver tipo de producto ──────────────────────────────
  // Una query ligera para determinar el tipo antes de instanciar
  // el use case correcto. Evita lógica condicional dentro del use case.
  const baseProduct = await new SupabaseProductRepository(client).findBySlug(
    slug,
  );

  if (!baseProduct) notFound();

  // ── Routing por tipo de producto ───────────────────────────
  if (baseProduct.productType === "program") {
    const result = await new GetProgramPageUseCase(
      new SupabaseProductDetailsRepository(client),
      new SupabaseProductRepository(client),
      new SupabaseAnnouncementRepository(client),
    ).execute({ programSlug: slug });

    if (!result) notFound();

    const studentSessionsRepository = new SupabaseStudentSessionsRepository(
      client,
    );

    const sessionBalance = await new GetSessionBalanceUseCase(
      studentSessionsRepository,
    ).execute({
      studentId: userId,
      productId: result.program.id,
    });

    const upcomingSessions = sessionBalance.enrollmentId
      ? await new GetUpcomingSessionsUseCase(studentSessionsRepository).execute(
          {
            enrollmentId: sessionBalance.enrollmentId,
          },
        )
      : [];

    return (
      <ProgramContent
        program={result.program}
        includedProducts={result.includedProducts}
        announcements={result.announcements}
        allAnnouncementsHref={`/aula-virtual/${slug}/anuncios`}
        remainingSessions={sessionBalance.sessionsRemaining}
        totalSessions={sessionBalance.sessionsIncluded}
        upcomingSessions={upcomingSessions}
        bookingUrl={process.env.NEXT_PUBLIC_CAL_BOOKING_URL}
      />
    );
  }

  if (baseProduct.productType === "course") {
    const result = await new GetCoursePageUseCase(
      new SupabaseProductDetailsRepository(client),
      new SupabaseModuleRepository(client),
      new SupabaseAnnouncementRepository(client),
    ).execute({ courseSlug: slug, studentId: userId });

    if (!result) notFound();

    return (
      <CourseContent
        course={result.course}
        modules={result.modules}
        announcements={result.announcements}
        allAnnouncementsHref={`/aula-virtual/${slug}/anuncios`}
      />
    );
  }

  if (baseProduct.productType === "workshop") {
    const result = await new GetWorkshopPageUseCase(
      new SupabaseProductDetailsRepository(client),
      new SupabaseWorkshopRepository(client),
      new SupabaseAnnouncementRepository(client),
      new SupabaseModuleResourceStorage(client),
    ).execute({ workshopSlug: slug, studentId: userId });

    if (!result) notFound();

    return (
      <WorkshopContent
        workshop={result.workshop}
        resources={result.resources}
        announcements={result.announcements}
        allAnnouncementsHref={`/aula-virtual/${slug}/anuncios`}
      />
    );
  }
}
