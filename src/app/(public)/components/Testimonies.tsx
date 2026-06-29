"use client";

import { useState, useCallback } from "react";
import { CarouselControls } from "@/shared/components/molecules/CarouselControls";
const testimonios = [
  {
    nombre: "Viviana Giadas",
    edad: "56 años",
    foto: "/testimoniosFOTOS/1.png",
    testimonio:
      "Mi querida Hebe! Gracias por haberme guiado en una sesión tan linda y liberadora con el propósito de encontrar el 'para qué' de mi síntoma. Tu capacidad para guiarme a llegar a la raíz del conflicto y así poder liberar mis emociones me sorprendió gratamente. Fue muy liberador. Gracias, gracias, gracias 🙏🏻✨❤️",
    stars: 5,
  },
  {
    nombre: "María Dolores Gimenez",
    edad: "67 años",
    foto: "/testimoniosFOTOS/2.png",
    testimonio:
      "Quiero expresar mi agradecimiento y admiración por el excelente trabajo de Hebe. Su enfoque en la biodescodificación, las 5 leyes biológicas y el coaching han sido de gran ayuda para mí. Los resultados obtenidos gracias a su acompañamiento son verdaderamente inspiradores y me ayudaron a superar conflictos y cambiar creencias que me limitaban. La super recomiendo.",
    stars: 5,
  },
  {
    nombre: "Selene Tuesta Salazar",
    edad: null,
    foto: "/testimoniosFOTOS/3.png",
    testimonio:
      "Hebe, mi más sincero agradecimiento por las sesiones de coaching. Tu habilidad para escuchar y guiarme ha sido transformadora. Me ayudaste a identificar creencias limitantes y a reconocer mis propias capacidades. He podido tomar decisiones más alineadas con mis valores y objetivos, y aprendí a manejar mejor mis emociones. Cada sesión fue un espacio seguro. ¡Gracias por tu invaluable contribución a mi proceso de desarrollo personal!",
    stars: 5,
  },
  {
    nombre: "Ornela Serodino",
    edad: "37 años",
    foto: "/testimoniosFOTOS/5.png",
    testimonio:
      "Siempre voy a estar agradecida con Hebe, porque me guió y acompañó de una forma amorosa y profesional. En más de una oportunidad me brindó la claridad que necesitaba y la capacidad de reflexionar encontrando respuestas a los 'para qué' de los síntomas que me generaban malestar. Sin duda recomiendo que puedan experimentar su calidez y guía en primera persona. Gracias gracias gracias ✨",
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mb-4" aria-label={`${count} estrellas`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-guarida-sky text-lg">
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonies() {
  const [current, setCurrent] = useState(0);
  const total = testimonios.length;

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + total) % total),
    [total],
  );
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  const t = testimonios[current];

  return (
    <section
      className="relative py-20 overflow-hidden"
      aria-label="Testimonios de pacientes"
    >
      {/* Fondo sutil */}
      <div
        className="absolute inset-0 opacity-14 pointer-events-none"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 container-guarida relative z-10">
        <div className="col-span-1 text-center md:text-start">
          <p className="text-guarida-sky text-sm tracking-[0.3em] uppercase mb-8">
            Experiencias reales
          </p>
          <h2 className="text-2xl sm:text-5xl font-spiritual text-white uppercase">
            Lo que dicen quienes me eligieron
          </h2>
        </div>

        {/* Carrusel */}
        <div className="col-span-2 max-w-3xl mx-auto">
          <div
            className="relative space-y-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-8 transition-all duration-500"
            role="region"
            aria-live="polite"
            aria-label={`Testimonio ${current + 1} de ${total}`}
          >
            {/* Comilla decorativa */}

            <p className="text-white/90 text-lg leading-relaxed italic relative z-10">
              " {t.testimonio} "
            </p>

            <div className="flex items-center gap-4 border-t border-white/20 pt-4">
              <img
                src="/1.png"
                alt={`Foto de ${t.nombre}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-guarida-sky/50"
                width={56}
                height={56}
              />
              <div>
                <p className="text-white font-semibold text-lg font-spiritual">
                  {t.nombre}
                </p>
                {t.edad && (
                  <p className="text-guarida-sky/80 text-sm">{t.edad}</p>
                )}
              </div>
            </div>
          </div>

          {/* Controles */}

          <CarouselControls
            current={current}
            total={testimonios.length}
            onPrev={prev}
            onNext={next}
            onSelect={setCurrent}
            color="sky"
          />
        </div>
      </div>
    </section>
  );
}
