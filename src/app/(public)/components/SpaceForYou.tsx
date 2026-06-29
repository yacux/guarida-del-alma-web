"use client";
import { useState } from "react";
import GlassCard from "./GlassCard"; // Asegúrate de importar Image si usas Next.js
import { ChevronDown, Check } from "lucide-react";
import { Dna, Shell, BrainCircuit, ShieldHalf, Activity } from "lucide-react";

const paraQuien = [
  "Repetís patrones en tus relaciones o te encontrás estancado en tu crecimiento personal.",
  "Atravesás dolencias físicas que no ceden y buscás comprender su origen emocional.",
  "Sobreviviste a vínculos tóxicos o abusivos y necesitás herramientas reales para volver a confiar en vos.",
  "Deseás vivir con mayor coherencia, paz interior y una conexión más fluida con la vida y con los demás.",
];

// Texto resumido para la versión móvil
const paraQuienResumenMobile =
  "Este espacio es para quienes buscan sanar patrones, dolencias físicas y vínculos tóxicos.";

const herramientas = [
  {
    nombre: "Biodescodificación",
    descripcion:
      "Exploramos el sentido biológico de tus síntomas para desactivar los programas inconscientes que afectan tu salud.",
    icon: <Dna color="#972088" strokeWidth={0.75} />,
  },
  {
    nombre: "Hipnoterapia",
    descripcion:
      "Accedemos al subconsciente para reprogramar creencias limitantes y sanar memorias profundas.",
    icon: <Shell color="#972088" strokeWidth={0.75} />,
  },
  {
    nombre: "Coaching Ontológico con PNL",
    descripcion:
      "Transformamos tu lenguaje y tus juicios para que diseñes tu futuro desde el amor propio, con asertividad y sin culpa.",
    icon: <BrainCircuit color="#972088" strokeWidth={0.75} />,
  },
  {
    nombre: "Acompañamiento en Abuso Narcisista",
    descripcion:
      "Un espacio especializado y empático para reconstruir la autoestima, establecer límites y salir del ciclo de manipulación.",
    icon: <ShieldHalf color="#972088" strokeWidth={0.75} />,
  },
  {
    nombre: "Danza Terapia",
    descripcion:
      "Usamos el movimiento consciente para liberar emociones atrapadas en el cuerpo y recuperar el gozo de habitar tu propia piel.",
    icon: <Activity color="#972088" strokeWidth={0.75} />,
  },
];

export default function SpaceForYou() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="text-guarida-violet relative py-20 bg-violet-50 overflow-hidden">
      <div className="container-guarida mx-auto px-4 sm:px-8">
        {/* Header - Diseño Adaptado al Prototipo */}
        <div className="text-center mb-16 relative">
          <p className="text-guarida-violet/80 text-xs tracking-[0.35em] uppercase mb-4 md:mb-2">
            Un espacio para sanar
          </p>

          <h2 className="text-3xl sm:text-3xl md:text-5xl font-spiritual leading-snug md:leading-tight mx-auto max-w-4xl px-4 md:px-0">
            Si te resuena, estás en el lugar indicado.
          </h2>

          {/* Subtle starburst effect (Opcional, requiere clase custom o SVG) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-30 md:opacity-50">
            <div className="w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Contenido principal con grid responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* COLUMNA IZQUIERDA: Si sentís que... */}
          <div className="md:border-r md:border-guarida-violet/10 md:pr-12 lg:pr-16">
            <p className="text-guarida-violet/90 text-lg tracking-[0.3em] uppercase mb-10 md:mb-12 text-center">
              Si sentís que...
            </p>

            {/* Versión Móvil: Resumen Compacto con icono */}
            <div className="border border-guarida-violet/10 rounded-2xl p-6 md:hidden">
              <div className="flex gap-2 sm:gap-4 items-center">
                <div className="text-guarida-violet/70 text-sm sm:text-base leading-relaxed text-center">
                  {paraQuien.map((e, index) => {
                    return <p key={`${e}+${index}`}>{e}</p>;
                  })}
                </div>
              </div>
            </div>

            {/* Versión Escritorio */}
            <ul className="space-y-6 hidden md:block">
              {paraQuien.map((item) => (
                <li
                  key={item}
                  className="border-b border-guarida-violet/10 pb-6 last:border-0"
                >
                  <div className="flex gap-4">
                    <span className="text-guarida-sky text-xs mt-1 shrink-0">
                      <Check size={20} strokeWidth={3} />
                    </span>
                    <p className="text-guarida-violet/70 text-sm leading-relaxed max-w-lg">
                      {item}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMNA DERECHA: Podemos trabajarlo con... / Herramientas */}
          <div className="md:pl-6 lg:pl-10">
            {/* Título de columna - Oculto en móvil */}
            <p className="text-guarida-violet/90 text-lg tracking-[0.3em] uppercase mb-10 md:mb-12 text-center">
              Podemos trabajarlo con...
            </p>

            {/* Versión Móvil: Carrusel Deslizable de Herramientas */}
            <div className="w-full h-auto mt-2 md:hidden">
              {/* Versión Móvil: Carrusel de Tarjetas de Cristal */}
              <div className="flex overflow-x-auto gap-4 pb-8 snap-x">
                {herramientas.map((h, i) => (
                  <div key={`${h}+${i}`} className="snap-center">
                    <GlassCard
                      // Si quisieras usar una imagen en lugar de un emoji:
                      // icon={<Image src="/icons/dna.webp" width={40} height={40} alt={h.nombre} />}
                      icon={h.icon}
                      title={h.nombre}
                    />
                  </div>
                ))}
              </div>

              {/* Botón de Contacto (Mobile) */}
              <button className="w-full mt-12 py-4 bg-guarida-violet/10 border border-guarida-violet/30 rounded-full text-guarida-violet text-sm font-semibold tracking-wider uppercase transition hover:bg-guarida-violet/20">
                Contacto
              </button>
            </div>

            {/* Versión Escritorio: Lista Interactiva (Hover y Acordeón) */}
            <ul className="space-y-6 hidden md:block">
              {herramientas.map((h, i) => (
                <li
                  key={`${h.nombre}-desktop-${i}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="border-b border-guarida-violet/10 pb-6 last:border-0 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between cursor-default">
                    <div className="flex gap-4">
                      <span className="text-base mt-0.5 transition-colors duration-300 shrink-0">
                        🪶
                      </span>

                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${
                          active === i
                            ? "text-guarida-fuchsia"
                            : "text-guarida-violet/70"
                        }`}
                      >
                        {h.nombre}
                      </span>
                    </div>

                    <ChevronDown
                      size={14}
                      className={`transition-all duration-300 ${
                        active === i ? "opacity-0" : "opacity-40"
                      }`}
                    />
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      active === i ? "max-h-24 mt-4" : "max-h-0"
                    }`}
                  >
                    <p className="text-guarida-fuchsia/80 text-sm leading-relaxed pl-10 max-w-md">
                      {h.descripcion}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
