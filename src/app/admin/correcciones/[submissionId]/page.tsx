// ============================================================
// src/app/admin/correcciones/[submissionId]/page.tsx
// ============================================================

import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import { SupabaseSubmissionRepository } from "@/infrastructure/repositories/supabase-submission.repository";
import { GetPendingSubmissionsUseCase } from "@/application/use-cases/get-pending-submissions/GetPendingSubmissionsUseCase";
import { GetSubmissionHistoryUseCase } from "@/application/use-cases/get-submission-history/GetSubmissionHistoryUseCase";
import { SubmissionHistoryChat } from "./_components/SubmissionHistoryChat";
import { ReviewForm } from "./_components/ReviewForm";

interface Props {
  params: Promise<{ submissionId: string }>;
}

export default async function SubmissionReviewPage({ params }: Props) {
  const { submissionId } = await params;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await createSupabaseServerClient();
  const submissionRepository = new SupabaseSubmissionRepository(client);

  const { items } = await new GetPendingSubmissionsUseCase(
    submissionRepository,
  ).execute();
  const item = items.find((i) => i.submissionId === submissionId);
  if (!item) notFound();

  // Historial completo: todos los intentos + su feedback,
  // usando assignmentId + studentId (no enrollment_id — funciona
  // igual sea matrícula directa o vía programa).
  const history = await new GetSubmissionHistoryUseCase(
    submissionRepository,
  ).execute(item.assignmentId, item.studentId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs text-white/40">
          {item.courseName} — {item.moduleTitle}
        </p>
        <h1 className="text-xl font-semibold text-white">
          {item.assignmentTitle}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {item.studentUsername} ({item.studentEmail})
        </p>
      </div>

      <SubmissionHistoryChat history={history} />

      <ReviewForm
        submissionId={item.submissionId}
        approvalMinScore={item.approvalMinScore}
      />
    </div>
  );
}
