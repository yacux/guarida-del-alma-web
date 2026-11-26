import MyCoursesAndWorkshopsClient from "./MyCoursesAndWorkshopsClient";
import type { ServiceData } from "./ServiceSection";
import { SupabaseProductRepository } from "@/infrastructure/repositories/supabase-product.repository";
import { createSupabaseServerClient } from "@/infrastructure/config/supabaseServerClient";
import type { Product } from "@/core/entities/Product";

const COURSE_BENEFITS = [
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
    onlyText: true,
  },
];

const WORKSHOP_BENEFITS = [
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

function mapProductToService(product: Product): ServiceData {
  const isWorkshop = product.productType === "workshop";

  return {
    title: product.name,
    description: product.shortDescription ?? product.description ?? "",
    href: isWorkshop ? `/talleres/${product.slug}` : `/cursos/${product.slug}`,
    cta: isWorkshop ? "Ver taller" : "Ver curso",
    srcImg: product.coverImageUrl ?? "/logo.jpg",
    productType: product.productType,
    priceArs: product.priceArs ?? 0,
  };
}

export default async function MyCoursesAndWorkshops() {
  const supabase = await createSupabaseServerClient();
  const productRepository = new SupabaseProductRepository(supabase);
  const products = await productRepository.findAllActive();

  const workshops = products
    .filter((product) => product.productType === "workshop")
    .map(mapProductToService);

  const courses = products
    .filter((product) => product.productType === "course")
    .map(mapProductToService);

  return (
    <MyCoursesAndWorkshopsClient
      workshops={workshops}
      courses={courses}
      workshopBenefits={WORKSHOP_BENEFITS}
      courseBenefits={COURSE_BENEFITS}
    />
  );
}
