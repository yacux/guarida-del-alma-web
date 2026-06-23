"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  BookOpen,
  User,
  X,
  HelpCircle,
  Award,
} from "lucide-react";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Mis Formaciones",
      href: "/aula-virtual",
      icon: LayoutDashboard,
    },
    // {
    //   name: "Explorar Talleres",
    //   href: "/talleres",
    //   icon: BookOpen,
    // },
    {
      name: "Mi Perfil",
      href: "/aula-virtual/perfil",
      icon: User,
    },
    {
      name: "Mis Certificados",
      href: "/aula-virtual/certificados",
      icon: Award,
    },
  ];

  return (
    <>
      {/* BARRA LATERAL */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-guarida-dark-violet backdrop-blur-xl border-r border-guarida-sky/50 p-6 flex flex-col justify-between
        transition-transform duration-300 md:translate-x-0 md:static md:h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-spiritual text-lg font-bold tracking-wider text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400"
            >
              LA GUARIDA DEL ALMA
            </Link>
            <button
              onClick={onClose}
              className="md:hidden text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                    ${
                      isActive
                        ? "bg-linear-to-r from-guarida-fuchsia/20 to-guarida-violet/10 border-l-4 border-guarida-fuchsia text-white font-semibold"
                        : "text-zinc-400 hover:bg-guarida-violet/10 hover:text-zinc-200"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-guarida-fuchsia" : "text-zinc-400 group-hover:text-zinc-300"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-800/60 space-y-4">
          <Link
            href="/soporte"
            className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            ¿Necesitás ayuda?
          </Link>

          <div className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/40">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-9 h-9 border border-guarida-fuchsia/40 shadow-md",
                  },
                }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">
                  Panel Alumno
                </span>
                <span className="text-[10px] text-zinc-500">
                  Espacio sagrado
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* OVERLAY MÓVIL */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}
    </>
  );
}
