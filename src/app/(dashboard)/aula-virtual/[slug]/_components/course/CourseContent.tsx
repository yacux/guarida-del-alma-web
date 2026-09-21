// ============================================================
// src/app/(dashboard)/aula-virtual/_components/course/CourseContent.tsx
//
// Compositor visual del overview de un curso.
// Orquesta secciones. No tiene lógica de negocio.
// Funciona igual para cursos comprados directamente
// y para cursos accedidos a través de un programa.
// ============================================================

import type { Course } from "@/core/entities/Product";
import type { Announcement } from "@/core/entities/Announcement";
import type { CourseModuleWithStatus } from "@/application/use-cases/get-course-page/GetCoursePageUseCase.output.dto";

import { ProductHero } from "../shared/ProductHero";
import { WelcomeVideo } from "../shared/WelcomeVideo";
import { AnnouncementSection } from "../program/sections/AnnouncementSection";
import { ModuleListSection } from "./sections/ModuleListSection";

interface CourseContentProps {
  course: Course;
  modules: CourseModuleWithStatus[];
  announcements: Announcement[];
  allAnnouncementsHref?: string;
}

export function CourseContent({
  course,
  modules,
  announcements,
  allAnnouncementsHref,
}: CourseContentProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* 1. Hero */}
      <ProductHero
        name={course.name}
        shortDescription={course.shortDescription}
        coverImageUrl={course.coverImageUrl}
        productType="course"
      />

      {/* 2. Anuncio destacado — solo si hay anuncios */}
      <AnnouncementSection announcements={announcements} />

      {/* 3. Video de bienvenida */}
      <WelcomeVideo welcomeVideoUrl={course.welcomeVideoUrl} />

      {/* 4. Lista de módulos */}
      <ModuleListSection modules={modules} courseSlug={course.slug} />
    </div>
  );
}
