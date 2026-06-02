import { Span } from "next/dist/trace";
import ServiceCard from "./ServiceCard";
import Image from "next/image";

interface Benefit {
  texto: string;
  resaltado?: string;
  extra?: string;
  isItalic?: boolean;
  onlyText?: boolean;
}

interface ServiceData {
  title: string;
  description: string;
  href: string;
  cta: string;
  srcImg: string;
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
    <section className="relative h-full py-20 bg-violet-50 overflow-hidden">
      {/* Gradiantes de desvanecimiento */}
      <div className="bg-linear-to-b from-violet-50 to-transparent z-30 absolute top-0 w-full h-12 sm:h-20" />
      <div className="bg-linear-to-t from-violet-50 to-transparent z-30 absolute bottom-0 w-full h-12 sm:h-20" />

      {/* Fondo decorativo (Ondas) */}
      {/* Aplicamos rotación inversa y alineación según la prop 'inverted' */}
      <div
        className={`absolute ${inverted ? "-rotate-45" : "rotate-45"} w-[120%] top-0 inset-0 pointer-events-none`}
      >
        <Image
          src="/onda.svg"
          alt="onda"
          fill
          className="opacity-50 object-cover"
        />
        <Image
          src="/onda2.svg"
          alt="onda"
          fill
          className="-translate-y-1/6 object-cover opacity-50"
        />
      </div>

      <div className="container grid grid-cols-1 lg:grid-cols-2 gap-20 relative">
        {/* Columna de Contenido (Título + Beneficios) */}
        {/* order-last en LG hará que se mueva a la derecha si está invertido */}
        <div
          className={`relative z-10 content-center ${inverted ? "lg:order-last" : ""}`}
        >
          <h2 className="text-4xl md:text-5xl font-spiritual text-guarida-violet mb-8">
            {title}
            <span className="italic text-guarida-fuchsia">{strongTitle}</span>
          </h2>

          <ul className="space-y-4 text-guarida-violet/80 text-lg leading-relaxed max-w-md">
            {benefits.map((item, index) => (
              <li key={`benefit-${index}`} className="flex items-start gap-3">
                <span className="text-guarida-fuchsia mt-0.5 text-xl">✓</span>
                {item.onlyText ? (
                  <span className="italic">{item.texto}</span>
                ) : (
                  <span>
                    {item.texto}
                    <strong
                      className={`text-guarida-violet font-medium ${item.isItalic ? "italic" : ""}`}
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

        {/* Columna de Cards */}
        <div className="relative z-10 flex flex-col gap-10 justify-center pt-6">
          {services.map((service, index) => (
            <ServiceCard key={`${service.title}-${index}`} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
