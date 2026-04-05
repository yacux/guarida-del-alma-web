"use client";

import { useState, useCallback } from "react";

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
      className="bg-guarida-violet relative py-28 overflow-hidden"
      aria-label="Testimonios de pacientes"
    >
      {/* Fondo sutil */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #89dadb 0%, transparent 50%), radial-gradient(circle at 80% 50%, #db2777 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <p className="text-guarida-sky text-sm tracking-[0.3em] uppercase text-center mb-3">
          Experiencias reales
        </p>
        <h2 className="text-4xl sm:text-5xl font-spiritual text-white text-center mb-16">
          Lo que dicen quienes me eligieron
        </h2>

        {/* Carrusel */}
        <div className="max-w-3xl mx-auto">
          <div
            className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 sm:p-12 transition-all duration-500"
            role="region"
            aria-live="polite"
            aria-label={`Testimonio ${current + 1} de ${total}`}
          >
            {/* Comilla decorativa */}
            <span
              className="absolute top-6 left-8 text-guarida-sky/30 font-spiritual text-8xl leading-none select-none"
              aria-hidden="true"
            >
              "
            </span>

            <StarRating count={t.stars} />

            <p className="text-white/90 text-lg leading-relaxed italic mb-8 relative z-10">
              {t.testimonio}
            </p>

            <div className="flex items-center gap-4 border-t border-white/20 pt-6">
              <img
                src={t.foto}
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
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={prev}
              aria-label="Testimonio anterior"
              className="w-11 h-11 rounded-full border border-white/30 text-white hover:bg-white/10 hover:border-guarida-sky transition-all duration-200 flex items-center justify-center text-lg"
            >
              ←
            </button>

            {/* Dots */}
            <div
              className="flex gap-2"
              role="tablist"
              aria-label="Navegación de testimonios"
            >
              {testimonios.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Ver testimonio ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-8 bg-guarida-sky"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Siguiente testimonio"
              className="w-11 h-11 rounded-full border border-white/30 text-white hover:bg-white/10 hover:border-guarida-sky transition-all duration-200 flex items-center justify-center text-lg"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
