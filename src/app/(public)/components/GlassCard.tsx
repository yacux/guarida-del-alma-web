import React from "react";

// Definimos la interfaz para las propiedades del componente
interface GlassCardProps {
  icon: React.ReactNode; // ReactNode permite pasar tanto emojis como componentes o imágenes
  title: string;
}

export default function GlassCard({ icon, title }: GlassCardProps) {
  return (
    <div
      className="group relative w-32 h-36 md:w-40 md:h-44 flex flex-col items-center justify-center 
                    bg-white/10 backdrop-blur-md border border-white/20 
                    rounded-3xl shadow-xl transition-all duration-300 
                    hover:bg-white/20 hover:scale-105 cursor-pointer"
    >
      {/* Fondo decorativo al hacer hover */}
      <div className="absolute inset-0 bg-linear-to-tr from-guarida-fuchsia/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Contenedor del ícono */}
      <div className="text-4xl mb-3 md:mb-4 drop-shadow-lg z-10">{icon}</div>

      {/* Título */}
      <p className="text-guarida-violet font-medium text-[10px] md:text-xs text-center px-2 leading-tight z-10">
        {title}
      </p>
    </div>
  );
}
