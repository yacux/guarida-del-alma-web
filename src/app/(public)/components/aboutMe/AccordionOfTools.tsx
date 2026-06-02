"use client";

import { useState } from "react";

const tools = [
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

export default function AccordionOfTools() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <p className="text-guarida-violet text-sm tracking-[0.2em] uppercase mb-5 font-medium">
        Cómo trabajo
      </p>
      <ul aria-label="Herramientas de trabajo de Hebe">
        {tools.map((h, i) => (
          <li
            key={h.nombre}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="border-b border-guarida-violet/10 last:border-0"
          >
            <div className="flex items-center justify-between py-3 cursor-default">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs transition-colors duration-300 ${active === i ? "text-guarida-fuchsia" : "text-guarida-sky"}`}
                  aria-hidden="true"
                >
                  🪶
                </span>
                <span
                  className={`font-medium transition-colors duration-300 ${active === i ? "text-guarida-violet" : "text-guarida-violet/60"}`}
                >
                  {h.nombre}
                </span>
              </div>
              <span
                className={`text-guarida-violet/30 text-xs transition-all duration-300 ${active === i ? "opacity-0" : "opacity-100"}`}
                aria-hidden="true"
              >
                —
              </span>
            </div>

            {/* Descripción expandible */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${active === i ? "max-h-24 pb-4" : "max-h-0"}`}
            >
              <p className="text-guarida-violet/55 text-sm leading-relaxed pl-6">
                {h.descripcion}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
