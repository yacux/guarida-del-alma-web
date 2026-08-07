// src/app/(dashboard)/aula-virtual/[slug]/_components/program/ProgramStats.tsx

import { Calendar, Award, Video } from "lucide-react";

interface ProgramStatsProps {
  individualSessionsCount: number;
  grantsCertificate: boolean;
  // futuro: sessionsUsed?: number
  // futuro: whatsappCommunityUrl?: string | null
}

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function ProgramStats({
  individualSessionsCount,
  grantsCertificate,
}: ProgramStatsProps) {
  const stats: StatItem[] = [
    {
      icon: <Video className="h-5 w-5" />,
      label: "Sesiones individuales",
      value:
        individualSessionsCount > 0
          ? `${individualSessionsCount} sesiones`
          : "No incluidas",
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Certificado",
      value: grantsCertificate ? "Incluido" : "No incluido",
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Qué incluye este programa</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-xl border bg-card p-4"
          >
            <span className="text-muted-foreground">{stat.icon}</span>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="font-semibold leading-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
