"use client";

import React, { useState } from "react";
import DashboardSidebar from "./aula-virtual/components/DashboardSidebar";
import DashboardHeader from "./aula-virtual/components/DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-guarida-fuchsia/30">
      {/* SIDEBAR */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        {/* HEADER (SOLO VISIBLE EN MÓVIL) */}
        <DashboardHeader
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* CONTENIDO DE LAS PÁGINAS */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
