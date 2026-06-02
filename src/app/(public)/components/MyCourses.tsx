import ServiceSection from "./ServiceSection";
import { Heart, Music } from "lucide-react";

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
      title: "curso de amor \n propio",
      description: "Un viaje de 8 semanas hacia tu centro.",
      href: "/cursos/amor-propio",
      cta: "Quiero mi transformación",
      srcImg: "/servicios/amor-propio.png",
    },
    {
      title: `curso de danza \n terapia`,
      description: "El cuerpo como canal de liberación emocional.",
      href: "/cursos/danza-terapia",
      cta: "Quiero ser guía Shaumbra",
      srcImg: "/servicios/danza-terapia.jpeg",
    },
  ];

  return (
    <ServiceSection
      title="Explorá mis "
      strongTitle="cursos"
      benefits={CourseBenefits}
      services={MAIN_COURSES}
    />
  );
}
