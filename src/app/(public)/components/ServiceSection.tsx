"use client";

import ServiceCard from "./ServiceCard";
import type { ProductType } from "@/core/entities/shared";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export interface Benefit {
  texto: string;
  resaltado?: string;
  extra?: string;
  isItalic?: boolean;
  onlyText?: boolean;
}

export interface ServiceData {
  title: string;
  description: string;
  href: string;
  cta: string;
  srcImg: string;
  productType?: ProductType;
  priceArs?: number;
}

interface ServiceSectionProps {
  title: string;
  strongTitle: string;
  benefits: Benefit[];
  services: ServiceData[];
  inverted?: boolean;
}

export default function ServiceSection({
  title,
  strongTitle,
  benefits,
  services,
  inverted = false,
}: ServiceSectionProps) {
  return (
    <div className="container-guarida grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-center relative z-10">
      {/* Columna de Contenido (Título + Beneficios) */}
      <div
        className={`lg:col-span-2 relative z-10 content-center ${inverted ? "lg:order-last" : ""}`}
      >
        <h2 className="text-4xl md:text-5xl font-spiritual text-guarida-violet mb-8">
          {title}
          <span className="italic text-guarida-fuchsia">{strongTitle}</span>
        </h2>

        <ul className="space-y-4 text-guarida-violet/94 text-lg leading-relaxed max-w-md">
          {benefits.map((item, index) => (
            <li key={`benefit-${index}`} className="flex items-start gap-3">
              <span className="text-guarida-fuchsia mt-0.5 text-xl">✓</span>
              {item.onlyText ? (
                <span className="italic">{item.texto}</span>
              ) : (
                <span>
                  {item.texto}
                  <strong
                    className={`text-guarida-fuchsia font-medium ${item.isItalic ? "italic" : ""}`}
                  >
                    {item.resaltado}
                  </strong>
                  {item.extra}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Columna de Cards con Carrusel en eje X y adelanto visual */}
      <div className="relative z-10 w-full min-w-0 lg:col-span-3">
        <Carousel
          opts={{
            align: "start",
            loop: false,
            slidesToScroll: 1,
          }}
          className="w-full relative"
        >
          {/* Gradientes de desvanecimiento verticales */}

          <CarouselContent className="relative p-4">
            <div className="bg-linear-to-l from-transparent to-violet-50/70 z-30 absolute top-0 left-0 h-full w-3 sm:w-5 pointer-events-none" />
            <div className="bg-linear-to-r from-transparent to-violet-50/70 z-30 absolute top-0 right-0 h-full w-3 sm:w-5 pointer-events-none" />
            {services.map((service, index) => (
              <CarouselItem
                key={`${service.title}-${index}`}
                className="basis-[84%] sm:basis-[72%] md:basis-[60%]"
              >
                <div className="gap-20">
                  <ServiceCard {...service} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {services.length > 1 && (
            <div className="flex items-center justify-end gap-3 mt-3 pr-2">
              <CarouselPrevious className="static translate-y-0 border-guarida-fuchsia/30 text-guarida-violet hover:bg-guarida-fuchsia hover:text-white cursor-pointer" />
              <CarouselNext className="static translate-y-0 border-guarida-fuchsia/30 text-guarida-violet hover:bg-guarida-fuchsia hover:text-white cursor-pointer" />
            </div>
          )}
        </Carousel>
      </div>
    </div>
  );
}
