"use client";
import Image from "next/image";
import { useState, useCallback } from "react";
import Link from "next/link";
import { CarouselControls } from "@/shared/components/molecules/CarouselControls";

const productos = [
  {
    nombre: "Aceite de Rosas para el Alma",
    descripcion:
      "Blend de aceites esenciales de rosa, sándalo y lavanda. Ideal para rituales de autocuidado y meditación. Calma el sistema nervioso y eleva la vibración emocional.",
    precio: "$4.800",
    imgSrc: "/servicios/danza-terapia.jpeg",
    categoria: "Aceites & Aromas",
    href: "/productos",
  },
  {
    nombre: "Crema Regeneradora Bienestar",
    descripcion:
      "Formulada con manteca de karité, aceite de argán y extracto de caléndula. Nutre profundamente la piel mientras promueve el bienestar emocional a través del tacto consciente.",
    precio: "$6.200",
    imgSrc: "/servicios/danza-terapia.jpeg",
    categoria: "Cremas & Cuidado",
    href: "/productos",
  },
  {
    nombre: "Agenda Vitácora del Alma",
    descripcion:
      "Tu compañera de autoconocimiento. Con espacios guiados para registrar emociones, gratitudes, metas y reflexiones. Diseñada para acompañar tu proceso interior a lo largo del año.",
    precio: "$8.500",
    imgSrc: "/servicios/danza-terapia.jpeg",
    categoria: "Papelería Consciente",
    href: "/productos",
  },
  {
    nombre: "Kit Iniciación Holística",
    descripcion:
      "Incluye aceite de meditación, vela aromática de soja, cristal de cuarzo rosa y guía de prácticas de bienestar. El regalo perfecto para empezar un camino de sanación.",
    precio: "$12.900",
    imgSrc: "/servicios/danza-terapia.jpeg",
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
      className="bg-violet-50 relative py-20 overflow-hidden border-t border-white/5"
      aria-label="Productos destacados"
    >
      {/* Fondo decorativo */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 container-guarida relative z-10">
        <div className="col-span-1 flex flex-col gap-4 md:gap-8">
          <p className="text-guarida-fuchsia text-sm tracking-[0.3em] uppercase mb-8">
            Bazar Holístico
          </p>
          <h2 className="text-4xl sm:text-5xl font-spiritual uppercase">
            Productos para tu bienestar
          </h2>

          {/* CTA */}
          <Link
            href="/productos"
            className="border border-guarida-violet/60 text-guarida-violet px-8 py-4 rounded-full hover:bg-guarida-violet/20 hover:border-guarida-violet transition-all duration-300 text-sm tracking-widest uppercase mr-auto "
          >
            Ver catálogo completo
          </Link>
        </div>

        {/* Carrusel */}
        <div className="col-span-2 max-w-3xl mx-auto text-guarida-sky">
          <div
            className="relative bg-guarida-dark-violet backdrop-blur-sm border border-white/10 rounded-2xl transition-all duration-500"
            role="region"
            aria-live="polite"
            aria-label={`Producto ${current + 1} de ${total}`}
          >
            <div className="grid grid-cols-2 sm:flex-row items-start gap-8">
              {/* imgSrc / icono producto */}
              <Image
                src={p.imgSrc}
                alt="producto de bienestar"
                width={80}
                height={80}
                className="shrink-0 w-full h-auto rounded-2xl bg-guarida-violet/20 border border-guarida-violet/30 flex items-center justify-center text-5xl"
                aria-hidden="true"
              />

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
          {/* Aquí usas el nuevo componente reutilizable */}
          <CarouselControls
            current={current}
            total={productos.length}
            onPrev={prev}
            onNext={next}
            onSelect={setCurrent}
            color="fuchsia"
          />
        </div>
      </div>
    </section>
  );
}
