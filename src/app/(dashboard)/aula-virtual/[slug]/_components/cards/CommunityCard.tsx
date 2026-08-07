// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/CommunityCard.tsx
//
// Card de comunidad.
//
// Responsabilidad:
//
// • Mostrar el acceso al grupo de WhatsApp.
//
// No conoce:
//
// • Program
// • Supabase
// ============================================================

import { ExternalLink, Users } from "lucide-react";

import { BaseActionCard } from "@/app/(dashboard)/aula-virtual/[slug]/_components/shared/BaseActionCard";

interface CommunityCardProps {
  whatsappUrl?: string;
}

export function CommunityCard({ whatsappUrl }: CommunityCardProps) {
  return (
    <BaseActionCard
      title="Comunidad WhatsApp"
      className="bg-guarida-forest"
      icon={<Users className="h-5 w-5 text-emerald-400" />}
      footer={<CommunityFooter whatsappUrl={whatsappUrl} />}
    >
      <p className="mt-4 text-sm leading-relaxed text-white/60">
        {whatsappUrl
          ? "Únete al grupo exclusivo del programa para recibir novedades, recordatorios y compartir el proceso con otras alumnas."
          : "La comunidad estará disponible próximamente."}
      </p>
    </BaseActionCard>
  );
}

interface CommunityFooterProps {
  whatsappUrl?: string;
}

function CommunityFooter({ whatsappUrl }: CommunityFooterProps) {
  if (!whatsappUrl) {
    return (
      <button
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white/30"
      >
        Próximamente
      </button>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-2.5 text-sm font-medium text-emerald-400 transition-opacity hover:opacity-80"
    >
      Unirme ahora
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
