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
      {/* Gradiantes de desvanecimiento horizontales*/}
      <div className="bg-linear-to-b from-violet-50 to-transparent z-30 absolute top-0 w-full h-12 sm:h-20" />
      <div className="bg-linear-to-t from-violet-50 to-transparent z-30 absolute bottom-0 w-full h-12 sm:h-20" />
      {/* Gradiantes de desvanecimiento verticales */}
      <div className="bg-linear-to-l from-transparent to-violet-50 z-30 absolute top-0 left-0 h-full w-10 sm:w-20" />
      <div className="bg-linear-to-r from-transparent to-violet-50 z-30 absolute top-0 right-0 h-full w-10 sm:w-20" />

      {/* Fondo decorativo (Ondas) */}
      {/* Aplicamos rotación inversa y alineación según la prop 'inverted' */}
      <div
        className={`left-0 absolute ${inverted ? "-rotate-14" : "-rotate-33"} md:${inverted ? "" : "rotate-52"} w-[160%] md:w-[116%] top-20 md:top-0 inset-0 pointer-events-none`}
      >
        {/* <Image
          src="/onda.svg"
          alt="onda"
          fill
          className="opacity-16 object-cover "
        /> */}
        <Image
          src="/onda.svg"
          alt="onda"
          width={3000}
          height={1000}
          className="translate-y-1/5 opacity-12 object-cover absolute"
        />
        <Image
          src="/onda2.svg"
          alt="onda"
          width={3000}
          height={1000}
          className="translate-y-1/6 object-cover opacity-27"
        />
      </div>

      <div className="container-guarida grid grid-cols-1 lg:grid-cols-2 gap-20 relative">
        {/* Columna de Contenido (Título + Beneficios) */}
        {/* order-last en LG hará que se mueva a la derecha si está invertido */}
        <div
          className={`relative z-10 content-center ${inverted ? "lg:order-last" : ""}`}
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
