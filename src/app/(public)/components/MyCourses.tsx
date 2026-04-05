import CourseCard from "./ServiceCard";
import { Heart, Music } from "lucide-react";
import Image from "next/image";

export default function MyCourses() {
  const CourseBenefits = [
    {
      texto: "Certificación y acompañamiento ",
      resaltado: "personalizado",
      extra: ".",
      isItalic: true,
    },
    {
      texto: "Acceso completo a la plataforma durante ",
      resaltado: "1 año",
      extra: ".",
      isItalic: false,
    },
    {
      texto: "Despertá tu potencial interno.",
      resaltado: "",
      extra: "",
      isItalic: true,
      onlyText: true, // Para el tercer caso que es solo una frase
    },
  ];

  const MAIN_COURSES = [
    {
      icon: (
        <Heart
          strokeWidth={1.3}
          className="w-12 h-12 mx-auto text-guarida-fuchsia"
        />
      ),
      colorText: "text-guarida-fuchsia",
      title: "curso de amor \n propio  incondicional",
      description: "Un viaje de 8 semanas hacia tu centro.",
      href: "/cursos/amor-propio",
      cta: "Ver programa",
      bgColor: "bg-white",
      glowColor: "shadow-[0_0_40px_-10px_rgba(139,110,246,0.9)]",
    },
    {
      icon: (
        <Music strokeWidth={1.3} className="w-12 h-12 mx-auto text-white" />
      ),
      colorText: "text-white",
      title: `curso de danza \n terapia`,
      description: "El cuerpo como canal de liberación emocional.",
      href: "/cursos/danza-terapia",
      cta: "Bailar ahora",
      bgColor: "bg-guarida-fuchsia",
      glowColor: "shadow-[0_0_40px_-10px_rgba(217,70,239,0.3)]", // Fuchsia glow
    },
  ];

  return (
    <section className="relative h-full py-28 bg-guarida-dark overflow-hidden">
      <div className="bg-linear-to-b from-guarida-dark to-transparent z-30 absolute top-0 left-0 w-full h-20" />
      {/* Fondo decorativo */}
      <div className="absolute rotate-45 w-[120%] top-0 inset-0 pointer-events-none">
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
        {/* Columna izquierda: título + checklist */}
        <div className=" relative z-10 content-center px-8">
          <h2 className="text-4xl md:text-5xl font-spiritual text-white mb-8">
            Explorá mis cursos
          </h2>

          <ul className="space-y-4 text-guarida-fuchsia/80 text-lg leading-relaxed max-w-md">
            {CourseBenefits.map((item, index) => (
              <li
                key={`course-benefit-${index}`}
                className="flex items-start gap-3"
              >
                {/* Checkmark estilizado */}
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

        {/* Columna derecha: cards apiladas verticalmente */}
        <div className="relative z-10 flex flex-col gap-10 justify-center pr-8 pt-6">
          {MAIN_COURSES.map((course, index) => (
            <CourseCard key={index} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
