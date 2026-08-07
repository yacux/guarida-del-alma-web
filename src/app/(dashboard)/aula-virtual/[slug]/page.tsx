// src/app/(dashboard)/aula-virtual/[slug]/page.tsx
// ============================================================

import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { SupabaseProductRepository } from "@/infrastructure/repositories/supabase-product.repository";
import { SupabaseProductDetailsRepository } from "@/infrastructure/repositories/supabase-product-details.repository";
import { SupabaseAnnouncementRepository } from "@/infrastructure/repositories/supabase-announcement.repository";
import { SupabaseModuleRepository } from "@/infrastructure/repositories/supabase-module.repository";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";

import { GetProgramPageUseCase } from "@/application/use-cases/get-program-page/GetProgramPageUseCase";
import { GetCoursePageUseCase } from "@/application/use-cases/get-course-page/GetCoursePageUseCase";

import { ProgramContent } from "./_components/program/ProgramContent";
import { CourseContent } from "./_components/course/CourseContent";

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

    return (
      <ProgramContent
        program={result.program}
        includedProducts={result.includedProducts}
        announcements={result.announcements}
        allAnnouncementsHref={`/aula-virtual/${slug}/anuncios`}
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

  // workshops → próxima fase
  notFound();
}
