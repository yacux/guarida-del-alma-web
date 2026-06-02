"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";

const paraQuien = [
  "Repetís patrones en tus relaciones o te encontrás estancado en tu crecimiento personal.",
  "Atravesás dolencias físicas que no ceden y buscás comprender su origen emocional.",
  "Sobreviviste a vínculos tóxicos o abusivos y necesitás herramientas reales para volver a confiar en vos.",
  "Deseás vivir con mayor coherencia, paz interior y una conexión más fluida con la vida y con los demás.",
];

const herramientas = [
  {
    nombre: "Biodescodificación",
    descripcion:
      "Exploramos el sentido biológico de tus síntomas para desactivar los programas inconscientes que afectan tu salud.",
  },
  {
    nombre: "Hipnoterapia",
    descripcion:
      "Accedemos al subconsciente para reprogramar creencias limitantes y sanar memorias profundas.",
  },
  {
    nombre: "Coaching Ontológico con PNL",
    descripcion:
      "Transformamos tu lenguaje y tus juicios para que diseñes tu futuro desde el amor propio, con asertividad y sin culpa.",
  },
  {
    nombre: "Acompañamiento en Abuso Narcisista",
    descripcion:
      "Un espacio especializado y empático para reconstruir la autoestima, establecer límites y salir del ciclo de manipulación.",
  },
  {
    nombre: "Danza Terapia",
    descripcion:
      "Usamos el movimiento consciente para liberar emociones atrapadas en el cuerpo y recuperar el gozo de habitar tu propia piel.",
  },
];

export default function SpaceForYou() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="text-guarida-violet relative py-20 bg-violet-50">
      <div className="container mx-auto ">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.35em] uppercase mb-3">
            Un espacio para sanar
          </p>

          <h2 className="text-3xl sm:text-5xl font-spiritual leading-tight mx-auto">
            Si te resuena, estás en el lugar indicado.
          </h2>
        </div>

        {/* Contenido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* IZQUIERDA */}
          <div>
            <p className="text-guarida-violet/90 text-lg tracking-[0.3em] uppercase mb-6">
              Si sentís que...
            </p>

            <ul className="space-y-4">
              {paraQuien.map((item) => (
                <li
                  key={item}
                  className="border-b border-guarida-violet/10 pb-4 last:border-0"
                >
                  <div className="flex gap-2 sm:gap-4">
                    <span className="text-guarida-sky text-xs mt-1">
                      <Check size={18} strokeWidth={3} />
                    </span>
                    <p className="text-guarida-violet/70 text-sm leading-relaxed">
                      {item}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* DERECHA */}
          <div>
            <p className="text-guarida-violet/90 text-lg tracking-[0.3em] uppercase mb-6">
              Podemos trabajarlo con...
            </p>

            <ul className="space-y-4">
              {herramientas.map((h, i) => (
                <li
                  key={h.nombre}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="border-b border-guarida-violet/10 pb-4 last:border-0"
                >
                  <div className="flex items-center justify-between cursor-default">
                    <div className="flex gap-2 sm:gap-4">
                      <span className="text-xs mt-1 transition-colors duration-300">
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
                      size={12}
                      className={`transition-all duration-300 ${
                        active === i ? "opacity-0" : "opacity-40"
                      }`}
                    />
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      active === i ? "max-h-24 mt-2" : "max-h-0"
                    }`}
                  >
                    <p className="text-guarida-fuchsia/70 text-sm leading-relaxed pl-6">
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
