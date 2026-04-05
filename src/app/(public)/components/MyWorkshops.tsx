import ServiceCard from "./ServiceCard";
import { Video, Mic } from "lucide-react";
import Image from "next/image";

const workshopsBenefits = [
  {
    texto: "Disponibilidad: 6 meses de acceso al ",
    resaltado: "contenido grabado",
    extra: ".",
    isItalic: false,
  },
  {
    texto: "Incluye un encuentro de integración ",
    resaltado: "en vivo",
    extra: ".",
    isItalic: true,
  },
  {
    texto: "Aprendé a tu propio ritmo.",
    resaltado: "",
    extra: "",
    isItalic: true,
    onlyText: true,
  },
];

const MAIN_WORKSHOPS = [
  {
    icon: (
      <Video strokeWidth={1.3} className="w-12 h-12 mx-auto text-emerald-400" />
    ),
    colorText: "text-emerald-400",
    title: "taller de video \n creativo",
    description: "Contá historias que conectan de verdad.",
    href: "/talleres/video-creativo",
    cta: "Ver taller",
    bgColor: "bg-white",
    glowColor: "shadow-[0_0_40px_-10px_rgba(52,211,153,0.9)]",
  },
  {
    icon: <Mic strokeWidth={1.3} className="w-12 h-12 mx-auto text-white" />,
    colorText: "text-white",
    title: "taller de voz \n auténtica",
    description: "Tu voz como herramienta de transformación.",
    href: "/talleres/voz-autentica",
    cta: "Empezar",
    bgColor: "bg-rose-600",
    glowColor: "shadow-[0_0_40px_-10px_rgba(225,29,72,0.4)]",
  },
];

export default function MyWorkshops() {
  return (
    <section className="relative h-full py-28 bg-guarida-dark overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute -rotate-45 w-[120%] top-0 inset-0 pointer-events-none">
        <Image
          src="/onda.svg"
          alt="onda"
          layout="fill"
          objectFit="cover"
          className="opacity-50"
        />
        <Image
          src="/onda2.svg"
          alt="onda"
          layout="fill"
          objectFit="cover"
          className="-translate-y-1/6 opacity-50"
        />
      </div>

      <div className="container grid grid-cols-2 gap-20">
        {/* Columna izquierda: cards */}
        <div className="relative z-10 flex flex-col gap-10 justify-center pr-8 pt-6">
          {MAIN_WORKSHOPS.map((workshop, index) => (
            <ServiceCard key={index} course={workshop} />
          ))}
        </div>
        {/* Columna derecha: título + checklist */}
        <div className="relative z-10 content-center px-8">
          <h2 className="text-4xl md:text-5xl uppercase font-spiritual text-white mb-8">
            Participá en mis talleres
          </h2>

          <ul className="space-y-4 text-guarida-fuchsia/80 text-lg leading-relaxed max-w-md">
            {workshopsBenefits.map((item, index) => (
              <li
                key={`workshop-benefit-${index}`}
                className="flex items-start gap-3"
              >
                <span className="text-guarida-fuchsia mt-0.5 text-xl">✓</span>

                {item.onlyText ? (
                  <span className="italic text-white/70">{item.texto}</span>
                ) : (
                  <span className="text-white/70">
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
      </div>
    </section>
  );
}
