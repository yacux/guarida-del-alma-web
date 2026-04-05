import CourseCard from "./CourseCard";
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
      title: "curso de amor propio incondicional",
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
    <section className="relative h-full py-16 flex flex-col bg-guarida-dark overflow-hidden">
      <div className="absolute translate-y-1/2 inset-0">
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
      {/* Fondo decorativo sutil (opcional para dar profundidad) */}
      <div className="relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-spiritual text-white">
          Explorá mis cursos
        </h2>
        <br />
        {/* Lista de beneficios unificada */}
        <ul className="space-y-3 text-guarida-fuchsia/80 text-sm leading-relaxed max-w-md mx-auto">
          {CourseBenefits.map((item, index) => (
            <li
              key={`course-benefit-${index}`}
              className="flex items-center justify-center gap-2"
            >
              <span className="text-guarida-fuchsia">•</span>

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
      <br />
      <div className="container flex justify-around gap-40">
        {MAIN_COURSES.map((course, index) => (
          <CourseCard key={index} course={course} />
        ))}
      </div>
    </section>
  );
}
