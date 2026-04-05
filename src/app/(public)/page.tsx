import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import MyCourses from "./components/MyCourses";
import MyWorkshops from "./components/MyWorkshops";
import Testimonies from "./components/Testimonies";
import FeaturedProducts from "./components/FeaturedProducts";

export const metadata: Metadata = {
  title: "La Guarida del Alma | Coaching, Bienestar y Sanación Integral",
  description:
    "Acompañamiento holístico con Hebe: coaching mente-cuerpo-emociones, PNL, bioneuroemoción, danza terapia e hipnosis. Transformá tu bienestar desde adentro.",
  openGraph: {
    title: "La Guarida del Alma",
    description:
      "Coaching, bienestar y sanación integral. Un espacio para transformar tu vida desde adentro.",
    url: "https://laguaridadelalma.com",
    siteName: "La Guarida del Alma",
    locale: "es_AR",
    type: "website",
  },
};

const especialidades = [
  "Coach mente, cuerpo y emociones",
  "Programación Neurolingüística (PNL)",
  "Bioneuroemoción",
  "Psicoeducación emocional",
  "Danza terapia",
  "Hipnosis",
  "Agente de cambio",
  "Divulgadora sobre narcisismo",
  "Microdosis: dolor, insomnio, ansiedad y depresión",
];

export default function Home() {
  return (
    <main className="font-sans">
      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <section
        className="sticky top-0 min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden"
        aria-label="Bienvenida"
        style={{
          background:
            "linear-gradient(175deg, #f0f8ff 0%, #e8f4f8 25%, #ddeef7 50%, #ede8f5 80%, #e8e0f0 100%)",
        }}
      >
        {/* Orbes de luz atmosféricos */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 30%, rgba(137,218,219,0.35) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 75% 65%, rgba(119,88,191,0.15) 0%, transparent 55%), radial-gradient(ellipse 40% 30% at 60% 20%, rgba(255,255,255,0.8) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />

        {/* Partículas suaves */}
        <div
          className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-guarida-sky opacity-40"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-guarida-violet opacity-30"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-guarida-sky opacity-20"
          aria-hidden="true"
        />
        <div
          className="absolute top-2/3 right-1/3 w-1 h-1 rounded-full bg-guarida-fuchsia opacity-25"
          aria-hidden="true"
        />

        {/* Contenido */}
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Tagline superior */}
          <p className="text-guarida-violet/70 text-xs sm:text-sm tracking-[0.4em] uppercase mb-8">
            Bienestar · Sanación · Consciencia
          </p>

          {/* Título principal */}
          <h1 className="font-spiritual text-5xl sm:text-6xl md:text-7xl mb-6 leading-none bg-linear-to-b from-guarida-sky via-guarida-violet to-guarida-violet uppercase bg-clip-text text-transparent">
            La Guarida del Alma
          </h1>

          {/* Bajada */}
          <p className="text-lg sm:text-xl text-guarida-violet/60 font-light tracking-wide max-w-xl mx-auto mb-12 leading-relaxed">
            Un espacio para encontrarte con vos misma,
            <br />
            sanar desde la raíz y vivir con plenitud.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cursos"
              className="bg-guarida-violet hover:bg-guarida-violet/80 text-white px-10 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105"
            >
              Explorar cursos
            </Link>
            <Link
              href="#sobre-hebe"
              className="border border-guarida-violet/30 hover:border-guarida-violet text-guarida-violet/70 hover:text-guarida-violet px-10 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-300"
            >
              Conocé a Hebe
            </Link>
          </div>
        </div>

        {/* Flecha scroll */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-guarida-violet/50 animate-bounce"
          aria-hidden="true"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── 2. CURSOS PRINCIPALES ───────────────────────────────── */}
      <MyCourses />

      {/* ── 3. SOBRE HEBE ───────────────────────────────────────── */}
      <section
        id="sobre-hebe"
        className="relative py-28 overflow-hidden"
        aria-label="Sobre Hebe"
        style={{
          background:
            "linear-gradient(160deg, #faf8ff 0%, #f3effe 40%, #eaf6f6 100%)",
        }}
      >
        {/* Orbe decorativo */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 50%, rgba(137,218,219,0.3) 0%, transparent 50%), radial-gradient(circle at 90% 20%, rgba(119,88,191,0.15) 0%, transparent 45%)",
          }}
          aria-hidden="true"
        />

        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Foto */}
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative">
                {/* Marco decorativo */}
                <div
                  className="absolute -inset-3 rounded-3xl opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, #7758bf, #89dadb, #db2777)",
                  }}
                  aria-hidden="true"
                />
                <div className="relative w-72 h-96 sm:w-80 sm:h-105 rounded-2xl overflow-hidden border border-guarida-violet/10">
                  <Image
                    src="/1.png"
                    alt="Hebe, coach de bienestar integral en La Guarida del Alma"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 288px, 320px"
                    priority
                  />
                </div>
                {/* Badge flotante */}
                <div className="absolute -bottom-4 -right-4 bg-guarida-violet rounded-2xl px-4 py-3 shadow-lg shadow-guarida-violet/20">
                  <p className="text-white text-xs tracking-widest uppercase">
                    Agente de cambio
                  </p>
                </div>
              </div>
            </div>

            {/* Texto */}
            <div className="order-1 lg:order-2">
              <p className="text-guarida-sky text-sm tracking-[0.3em] uppercase mb-4">
                Quién soy
              </p>
              <h2 className="text-4xl sm:text-5xl font-spiritual text-guarida-violet mb-6 leading-tight">
                Hola, soy Hebe
              </h2>
              <p className="text-guarida-violet/70 text-lg leading-relaxed mb-6">
                Soy coach integrativa especializada en mente, cuerpo y
                emociones. Mi camino de vida me llevó a formarme en múltiples
                disciplinas del bienestar para acompañar a otras personas a
                encontrar su propia raíz de sanación.
              </p>
              <p className="text-guarida-violet/55 leading-relaxed mb-10">
                Creo profundamente que cada síntoma tiene un mensaje, y que el
                verdadero cambio ocurre cuando nos atrevemos a escucharlo. Desde
                un enfoque amoroso, profesional y sin juicio, acompaño procesos
                de transformación real.
              </p>

              {/* Especialidades */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                role="list"
                aria-label="Especialidades de Hebe"
              >
                {especialidades.map((esp) => (
                  <div
                    key={esp}
                    role="listitem"
                    className="flex items-start gap-2.5"
                  >
                    <span
                      className="text-guarida-sky mt-1 text-sm shrink-0"
                      aria-hidden="true"
                    >
                      ◆
                    </span>
                    <span className="text-guarida-violet/70 text-sm leading-snug">
                      {esp}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href="/sesiones"
                  className="inline-block bg-guarida-fuchsia hover:bg-guarida-fuchsia/80 text-white px-10 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105"
                >
                  Trabajar con Hebe
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TESTIMONIOS ─────────────────────────────────────── */}
      <Testimonies />

      {/* ── 5. TALLERES ────────────────────────────────────────── */}
      <MyWorkshops />

      {/* ── 6. ACOMPAÑAMIENTO INDIVIDUAL ───────────────────────── */}
      <section
        className="relative py-24 text-center bg-guarida-violet overflow-hidden"
        aria-label="Acompañamiento individual"
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="container relative z-10 max-w-3xl mx-auto">
          <p className="text-guarida-sky text-sm tracking-[0.3em] uppercase mb-4">
            Sesiones personalizadas
          </p>
          <h2 className="text-4xl md:text-5xl font-spiritual text-white mb-6">
            Acompañamiento Individual
          </h2>
          <p className="text-lg text-white/70 mb-10 leading-relaxed">
            Bioneuroemoción, Coaching y PNL. Un espacio uno a uno diseñado para
            desatar nudos y encontrar claridad en tu proceso personal.
          </p>
          <Link
            href="/sesiones"
            className="inline-block bg-white text-guarida-violet px-10 py-4 rounded-full font-semibold hover:scale-105 transition-transform duration-300 text-sm tracking-widest uppercase"
          >
            Reservar mi lugar
          </Link>
        </div>
      </section>

      {/* ── 7. PRODUCTOS DESTACADOS ───────────────────────────── */}
      <FeaturedProducts />
    </main>
  );
}
