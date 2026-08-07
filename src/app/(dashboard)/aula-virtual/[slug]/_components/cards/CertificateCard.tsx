// ============================================================
// src/app/(dashboard)/aula-virtual/_components/cards/CertificateCard.tsx
//
// Card del certificado del programa.
//
// Responsabilidad:
//
// • Mostrar el estado del certificado.
// • Mostrar CTA para descargarlo.
// • Mostrar requisitos cuando todavía no está disponible.
//
// No conoce:
//
// • Program
// • Enrollment
// • Supabase
// ============================================================

import { Award, ExternalLink } from "lucide-react";

import { BaseActionCard } from "../shared/BaseActionCard";

interface CertificateCardProps {
  /**
   * Indica si el certificado ya puede descargarse.
   */
  available: boolean;

  /**
   * Cantidad de productos incluidos.
   * Se usa para informar los requisitos.
   */
  totalIncludedProducts?: number;

  /**
   * URL del certificado.
   * Si existe y está disponible, habilita la descarga.
   */
  certificateUrl?: string;
}

export function CertificateCard({
  available,
  totalIncludedProducts,
  certificateUrl,
}: CertificateCardProps) {
  return (
    <BaseActionCard
      title="Certificación"
      className="bg-guarida-olive"
      icon={<Award className="h-5 w-5 text-guarida-gold" />}
      footer={
        <CertificateCardFooter
          available={available}
          certificateUrl={certificateUrl}
        />
      }
    >
      {available ? (
        <p className="mt-3 text-sm text-white/90">
          ¡Felicitaciones! Ya podés descargar tu certificado.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-snug text-white/70">
            {totalIncludedProducts
              ? `Al completar los ${totalIncludedProducts} contenidos incluidos obtendrás tu certificado.`
              : "Completá todos los contenidos del programa para obtener tu certificado."}
          </p>

          <p className="mt-1 font-semibold text-guarida-gold">Pendiente</p>
        </>
      )}
    </BaseActionCard>
  );
}

interface CertificateCardFooterProps {
  available: boolean;
  certificateUrl?: string;
}

function CertificateCardFooter({
  available,
  certificateUrl,
}: CertificateCardFooterProps) {
  if (available && certificateUrl) {
    return (
      <a
        href={certificateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-guarida-gold/20 py-2.5 text-sm font-medium text-guarida-gold transition-opacity hover:opacity-80"
      >
        Descargar certificado
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white/80 transition-opacity hover:opacity-80">
      Ver requisitos
      <ExternalLink className="h-3.5 w-3.5" />
    </button>
  );
}
