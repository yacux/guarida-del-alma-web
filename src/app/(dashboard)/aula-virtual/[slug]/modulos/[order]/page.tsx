// ============================================================
// src/app/(dashboard)/aula-virtual/[slug]/_components/modulos/[order]/page.tsx
// ============================================================

import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { SupabaseProductDetailsRepository } from "@/infrastructure/repositories/supabase-product-details.repository";
import { SupabaseModuleRepository } from "@/infrastructure/repositories/supabase-module.repository";
import { SupabaseSubmissionRepository } from "@/infrastructure/repositories/supabase-submission.repository";
import { SupabaseModuleResourceStorage } from "@/infrastructure/repositories/supabase-module-resource-storage.repository";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { GetModuleContentsUseCase } from "@/application/use-cases/get-module-contents/GetModuleContentsUseCase";
import { ModulePage } from "../[order]/_components/ModulePage";

interface Props {
  params: Promise<{ slug: string; order: string }>;
}

export default async function ModuleDetailPage({ params }: Props) {
  const { slug, order } = await params;

  // ── Autenticación ──────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // ── Validar el parámetro order ─────────────────────────────
  const moduleOrder = parseInt(order, 10);
  if (isNaN(moduleOrder) || moduleOrder < 0) notFound();

  const client = await createSupabaseServerClient();

  const result = await new GetModuleContentsUseCase(
    new SupabaseProductDetailsRepository(client),
    new SupabaseModuleRepository(client),
    new SupabaseSubmissionRepository(client),
    new SupabaseModuleResourceStorage(client),
  ).execute({
    courseSlug: slug,
    moduleOrder,
    studentId: userId,
  });

  if (!result) notFound();

  return <ModulePage result={result} courseSlug={slug} />;
}
