import ServiceSection from "./ServiceSection";

export default function MyWorkshops() {
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
      title: "Renacer del \n abuso narcisista",
      description: "Contá historias que conectan de verdad.",
      href: "/talleres/video-creativo",
      cta: "Ver taller",
      srcImg: "/servicios/renacer-luego-abuso-narcisista.jpeg",
    },
    {
      title: "Desata tu \n voz ",
      description: "Tu voz como herramienta de transformación.",
      href: "/talleres/desata-tu-voz",
      cta: "Empezar",
      srcImg: "/servicios/desata-tu-voz.jpeg",
    },
  ];
  return (
    <ServiceSection
      title="Participá en mis "
      strongTitle="talleres"
      benefits={workshopsBenefits}
      services={MAIN_WORKSHOPS}
      inverted={true}
    />
  );
}

//src/app/(public)/page.tsx (o donde esté tu MyWorkshops)

// export default async function MyWorkshops() {
//   // En Next.js App Router, puedes llamar al Use Case directamente o a una constante de Infra
//   const workshops = await getFeaturedWorkshopsUseCase();
//   const benefits = getWorkshopGeneralBenefits(); // Traído de una constante en core o infra

//   return (
//     <ServiceSection
//       title="Participá en mis talleres"
//       benefits={benefits}
//       services={workshops}
//       inverted={true}
//     />
//   );
// }
