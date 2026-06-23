import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
// es lo que tiene el sidebar pero en version movil.

// dashboardHeaderProps es una interfaz que define las propiedades que el componente DashboardHeader espera recibir.
// En este caso, solo hay una propiedad: toggleSidebar, que es una función que se llama cuando el usuario hace clic en el botón de menú para abrir o cerrar la barra lateral.

interface DashboardHeaderProps {
  toggleSidebar: () => void;
}

export default function DashboardHeader({
  toggleSidebar,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between md:hidden bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-30">
      <button
        onClick={toggleSidebar}
        className="text-zinc-400 hover:text-white p-1"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>
      <span className="font-spiritual text-sm font-bold tracking-wider text-zinc-200">
        LA GUARIDA
      </span>
      <UserButton />
    </header>
  );
}
