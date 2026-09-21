// ============================================================
// src/app/(admin)/correcciones/_components/SubmissionQueueList.tsx
// ============================================================

import Link from "next/link";
import { Clock } from "lucide-react";
import type { SubmissionReviewItem } from "@/core/repositories/ISubmissionRepository";

interface Props {
  items: SubmissionReviewItem[];
}

export function SubmissionQueueList({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Link
          key={item.submissionId}
          href={`/admin/correcciones/${item.submissionId}`}
          className="flex items-center justify-between rounded-xl border border-white/5 bg-guarida-dark-violet p-4 transition-all hover:border-white/15"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {item.studentUsername}
              </span>
              <span className="text-xs text-white/30">{item.studentEmail}</span>
            </div>
            <p className="text-sm text-white/70">{item.assignmentTitle}</p>
            <p className="text-xs text-white/40">
              {item.courseName} — {item.moduleTitle}
              {item.attemptNumber > 1 && ` · intento ${item.attemptNumber}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <Clock className="h-3.5 w-3.5" />
            {new Date(item.submittedAt).toLocaleDateString("es-AR")}
          </div>
        </Link>
      ))}
    </div>
  );
}
