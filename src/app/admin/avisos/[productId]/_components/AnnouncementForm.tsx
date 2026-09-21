// ============================================================
// src/app/admin/avisos/[productId]/_components/AnnouncementForm.tsx
// ============================================================
"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { createAnnouncementAction } from "../../_actions/create-announcement.action";
import type { UUID } from "@/core/entities/shared";

export function AnnouncementForm({ productId }: { productId: UUID }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createAnnouncementAction({
        productId,
        title,
        content,
        isPinned,
      });
      if (result.success) {
        setTitle("");
        setContent("");
        setIsPinned(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-white/10 bg-guarida-dark-violet p-5"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título del aviso"
        className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-white/25 focus:border-guarida-violet/50 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Contenido del aviso..."
        className="resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-white/25 focus:border-guarida-violet/50 focus:outline-none"
      />
      <label className="flex items-center gap-2 text-sm text-white/60">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
        />
        Fijar arriba del foro
      </label>

      <button
        type="submit"
        disabled={isPending || !title.trim() || !content.trim()}
        className="flex w-fit items-center gap-2 rounded-lg bg-guarida-violet px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Publicar
      </button>

      {success && <p className="text-xs text-guarida-sky">¡Aviso publicado!</p>}
    </form>
  );
}
