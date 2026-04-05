"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const productos = [
  {
    nombre: "Aceite de Rosas para el Alma",
    descripcion:
      "Blend de aceites esenciales de rosa, sándalo y lavanda. Ideal para rituales de autocuidado y meditación. Calma el sistema nervioso y eleva la vibración emocional.",
    precio: "$4.800",
    emoji: "🌹",
    categoria: "Aceites & Aromas",
    href: "/productos",
  },
  {
    nombre: "Crema Regeneradora Bienestar",
    descripcion:
      "Formulada con manteca de karité, aceite de argán y extracto de caléndula. Nutre profundamente la piel mientras promueve el bienestar emocional a través del tacto consciente.",
    precio: "$6.200",
    emoji: "✨",
    categoria: "Cremas & Cuidado",
    href: "/productos",
  },
  {
    nombre: "Agenda Vitácora del Alma",
    descripcion:
      "Tu compañera de autoconocimiento. Con espacios guiados para registrar emociones, gratitudes, metas y reflexiones. Diseñada para acompañar tu proceso interior a lo largo del año.",
    precio: "$8.500",
    emoji: "📖",
    categoria: "Papelería Consciente",
    href: "/productos",
  },
  {
    nombre: "Kit Iniciación Holística",
    descripcion:
      "Incluye aceite de meditación, vela aromática de soja, cristal de cuarzo rosa y guía de prácticas de bienestar. El regalo perfecto para empezar un camino de sanación.",
    precio: "$12.900",
    emoji: "🔮",
    categoria: "Kits & Regalos",
    href: "/productos",
  },
];

export default function FeaturedProducts() {
  const [current, setCurrent] = useState(0);
  const total = productos.length;

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + total) % total),
    [total],
  );
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  const p = productos[current];

  return (
    <section
      className="bg-guarida-dark relative py-28 overflow-hidden border-t border-white/5"
      aria-label="Productos destacados"
    >
      {/* Fondo decorativo */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 30%, #7758bf 0%, transparent 50%), radial-gradient(circle at 20% 80%, #89dadb 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <p className="text-guarida-fuchsia text-sm tracking-[0.3em] uppercase text-center mb-3">
          Bazar Holístico
        </p>
        <h2 className="text-4xl sm:text-5xl font-spiritual text-white text-center mb-4">
          Productos para tu bienestar
        </h2>
        <p className="text-white/50 text-center mb-16 max-w-xl mx-auto">
          Selección de productos naturales y herramientas de autoconocimiento
          para acompañar tu proceso.
        </p>

        {/* Carrusel */}
        <div className="max-w-3xl mx-auto">
          <div
            className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 transition-all duration-500"
            role="region"
            aria-live="polite"
            aria-label={`Producto ${current + 1} de ${total}`}
          >
            {/* Categoría badge */}
            <span className="inline-block text-xs tracking-widest uppercase text-guarida-sky border border-guarida-sky/30 rounded-full px-3 py-1 mb-6">
              {p.categoria}
            </span>

            <div className="flex flex-col sm:flex-row items-start gap-8">
              {/* Emoji / icono producto */}
              <div
                className="shrink-0 w-24 h-24 rounded-2xl bg-guarida-violet/20 border border-guarida-violet/30 flex items-center justify-center text-5xl"
                aria-hidden="true"
              >
                {p.emoji}
              </div>

              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-spiritual text-white mb-4">
                  {p.nombre}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {p.descripcion}
                </p>
                <div className="flex items-center gap-6 flex-wrap">
                  <span className="text-guarida-fuchsia text-2xl font-spiritual">
                    {p.precio}
                  </span>
                  <Link
                    href={p.href}
                    className="text-sm tracking-widest uppercase text-white/60 hover:text-guarida-sky border-b border-white/20 hover:border-guarida-sky transition-colors duration-200 pb-0.5"
                  >
                    Ver catálogo →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={prev}
              aria-label="Producto anterior"
              className="w-11 h-11 rounded-full border border-white/20 text-white hover:bg-white/5 hover:border-guarida-violet transition-all duration-200 flex items-center justify-center text-lg"
            >
              ←
            </button>

            <div
              className="flex gap-2"
              role="tablist"
              aria-label="Navegación de productos"
            >
              {productos.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Ver producto ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-8 bg-guarida-fuchsia"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Siguiente producto"
              className="w-11 h-11 rounded-full border border-white/20 text-white hover:bg-white/5 hover:border-guarida-violet transition-all duration-200 flex items-center justify-center text-lg"
            >
              →
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            href="/productos"
            className="inline-block border border-guarida-violet/60 text-white px-10 py-4 rounded-full hover:bg-guarida-violet/20 hover:border-guarida-violet transition-all duration-300 text-sm tracking-widest uppercase"
          >
            Ver catálogo completo
          </Link>
        </div>
      </div>
    </section>
  );
}
