// src/app/admin/layout.tsx
import Link from "next/link";
import { TimezoneProvider } from "@/shared/timezone/TimezoneProvider";

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/correcciones", label: "Correcciones" },
  { href: "/admin/avisos", label: "Avisos" },
  { href: "/admin/alumnos", label: "Alumnos" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TimezoneProvider>
      <div className="min-h-screen bg-guarida-dark">
        <nav className="flex gap-1 border-b border-white/5 bg-guarida-dark-violet px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </TimezoneProvider>
  );
}
