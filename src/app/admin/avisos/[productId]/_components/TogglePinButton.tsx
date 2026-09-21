"use client";

import { useTransition } from "react";
import { togglePinAnnouncementAction } from "../../_actions/toggle-pin-announcement.action";

interface TogglePinButtonProps {
  announcementId: string;
  isPinned: boolean;
  productId: string;
}

export function TogglePinButton({
  announcementId,
  isPinned,
  productId,
}: TogglePinButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await togglePinAnnouncementAction(announcementId, !isPinned, productId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-all focus:outline-none ${
        isPinned
          ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20"
          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isPending ? "Actualizando..." : isPinned ? "📌 Fijado" : "Desfijado"}
    </button>
  );
}
