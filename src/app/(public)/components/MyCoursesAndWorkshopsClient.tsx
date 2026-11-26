"use client";

import { useState } from "react";
import Image from "next/image";
import ServiceSection, {
  type Benefit,
  type ServiceData,
} from "./ServiceSection";

interface MyCoursesAndWorkshopsClientProps {
  courses: ServiceData[];
  workshops: ServiceData[];
  courseBenefits: Benefit[];
  workshopBenefits: Benefit[];
}

type ActiveTab = "workshop" | "course";

export default function MyCoursesAndWorkshopsClient({
  courses,
  workshops,
  courseBenefits,
  workshopBenefits,
}: MyCoursesAndWorkshopsClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("workshop");

  const isWorkshops = activeTab === "workshop";

  return (
    <section
      id="formaciones"
      className="relative h-full py-20 bg-violet-50 overflow-hidden"
    >
      {/* Gradientes de desvanecimiento horizontales (lo más externo) */}
      <div className="bg-linear-to-b from-violet-50 to-transparent z-30 absolute top-0 w-full h-12 sm:h-20 pointer-events-none" />
      <div className="bg-linear-to-t from-violet-50 to-transparent z-30 absolute bottom-0 w-full h-12 sm:h-20 pointer-events-none" />

      {/* Gradientes de desvanecimiento verticales */}
      <div className="bg-linear-to-l from-transparent to-violet-50 z-30 absolute top-0 left-0 h-full w-10 sm:w-20 pointer-events-none" />
      <div className="bg-linear-to-r from-transparent to-violet-50 z-30 absolute top-0 right-0 h-full w-10 sm:w-20 pointer-events-none" />

      {/* Fondo decorativo (Ondas) */}
      <div
        className={`left-0 absolute ${isWorkshops ? "-rotate-14" : "-rotate-33"} md:${isWorkshops ? "" : "rotate-52"} w-[160%] md:w-[116%] top-20 md:top-0 inset-0 pointer-events-none transition-transform duration-500`}
      >
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

      {/* Selector adentro de la sección */}
      <div className="relative z-40 mb-14 flex justify-center px-4">
        <div
          role="tablist"
          aria-label="Seleccionar categoría"
          className="inline-flex rounded-full p-1.5 bg-white/90 backdrop-blur-sm border border-guarida-fuchsia/25 shadow-md"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isWorkshops}
            onClick={() => setActiveTab("workshop")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              isWorkshops
                ? "bg-guarida-fuchsia text-white shadow"
                : "text-guarida-violet hover:text-guarida-fuchsia"
            }`}
          >
            Talleres
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isWorkshops}
            onClick={() => setActiveTab("course")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              !isWorkshops
                ? "bg-guarida-fuchsia text-white shadow"
                : "text-guarida-violet hover:text-guarida-fuchsia"
            }`}
          >
            Cursos
          </button>
        </div>
      </div>

      {isWorkshops ? (
        <ServiceSection
          title="Participá en mis "
          strongTitle="talleres"
          benefits={workshopBenefits}
          services={workshops}
          inverted={true}
        />
      ) : (
        <ServiceSection
          title="Explorá mis "
          strongTitle="cursos"
          benefits={courseBenefits}
          services={courses}
          inverted={false}
        />
      )}
    </section>
  );
}
