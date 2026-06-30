import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Hero from "./components/Hero";
import MyCourses from "./components/MyCourses";
import MyWorkshops from "./components/MyWorkshops";
import Testimonies from "./components/Testimonies";
import FeaturedProducts from "./components/FeaturedProducts";
import SpaceForYou from "./components/SpaceForYou";
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

export default function Home() {
  return (
    <main className="font-sans">
      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <Hero />

      {/* ── ¿ESTE ESPACIO ES PARA VOS? ─────────────────────── */}
      <SpaceForYou />

      {/* ── . SOBRE HEBE ───────────────────────────────────────── */}
      <section
        id="sobre-hebe"
        className="relative py-20 overflow-hidden"
        aria-label="Sobre Hebe"
      >
        <div className="container-guarida relative z-10 text-center md:text-start">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Foto */}
            <div className="col-span-1 my-auto space-y-4 sm:space-y-8">
              <div className="mr-auto relative rounded-2xl bg-linear-to-br from-transparent to-guarida-fuchsia/20 py-2">
                {/* Foto para desktop*/}
                <div className="mx-auto relative w-72 sm:w-80 sm:h-105 rounded-2xl overflow-hidden border border-guarida-violet/10 hidden lg:block">
                  <Image
                    src="/hebeVertical.webp"
                    alt="Hebe, coach de bienestar integral en La Guarida del Alma"
                    className="object-cover object-top"
                    width={1600}
                    height={2396}
                    priority
                  />
                </div>
                {/* Foto para mobile*/}
                <div className="mx-auto relative w-full aspect-video rounded-2xl overflow-hidden border border-guarida-violet/10 lg:hidden">
                  <Image
                    src="/hebeHorizontal.png"
                    alt="Hebe, coach de bienestar integral (versión mobile)"
                    className="object-cover"
                    fill
                    priority
                  />
                </div>

                <div className="absolute -bottom-3 -right-3 bg-guarida-violet/74 rounded-2xl px-4 py-2 shadow-lg shadow-guarida-violet/20">
                  <p className="text-white text-xs tracking-widest uppercase">
                    Agente de cambio
                  </p>
                </div>
              </div>
            </div>

            {/* Texto */}
            <div className="col-span-1 order-1 sm:col-span-2 space-y-10">
              {/* Encabezado */}
              <h2 className="text-4xl sm:text-5xl font-spiritual mb-6 leading-tight text-white">
                Hola, soy Hebe
              </h2>
              <div className="text-white/90 ">
                {/* Párrafo 1 simplificado para mobile */}
                <p className="text-lg leading-relaxed mb-4 md:hidden">
                  Transformé el concepto de <strong>"Guarida"</strong>, un
                  rincón de calma en mi hogar, en un espacio de sanación para
                  vos.
                </p>
                {/* Versión completa para desktop */}
                <p className="text-lg leading-relaxed mb-4 hidden md:block">
                  En mi hogar siempre llamamos <strong>"Guarida"</strong> a ese
                  rincón de protección y calma. <br /> Hoy transformé ese
                  concepto en un espacio de sanación para vos.
                </p>

                {/* Párrafo 2 simplificado para mobile */}
                <p className="leading-relaxed md:hidden">
                  Mi <strong>misión</strong> es acompañarte a
                  <strong> tomar conciencia</strong> de que la sanación comienza
                  al descubrir el mensaje de tus síntomas.
                </p>
                {/* Versión completa para desktop */}
                <p className="leading-relaxed hidden md:block">
                  Mi <strong>misión</strong> es acompañarte a
                  <strong> tomar conciencia</strong>. Creo firmemente que la
                  sanación comienza cuando descubrimos el mensaje que nos envían
                  nuestros síntomas y nuestras trabas emocionales.
                </p>
                <br />

                {/* Párrafo 3 oculto por completo en mobile */}
                <p className="leading-relaxed hidden md:block">
                  Para llegar a la <strong>raíz de lo que te detiene</strong>,
                  integro diversas herramientas que trabajan de manera profunda
                  a nivel mental, emocional, corporal y espiritual.
                </p>
              </div>

              {/* Cita destacada */}
              <blockquote className="border-l-2 border-white/30 pl-6">
                <p className="font-spiritual text-xl sm:text-2xl text-white/80 italic leading-snug">
                  "La sanación comienza cuando descubrimos el conflicto detrás
                  del conflicto."
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>
      {/* ── CURSOS PRINCIPALES ───────────────────────────────── */}
      <MyCourses />

      {/* ── 6. ACOMPAÑAMIENTO INDIVIDUAL ───────────────────────── */}
      <section
        className="relative py-20 text-center overflow-hidden"
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
        <div className="container-guarida relative z-10 max-w-3xl mx-auto">
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
            className="inline-block border hover:bg-linear-to-t hover:to-guarida-sky/24 hover:text-white border-guarida-sky text-guarida-sky px-8 py-4 rounded-full font-semibold text-sm tracking-widest uppercase"
          >
            Reservar mi lugar
          </Link>
        </div>
      </section>

      {/* ── TALLERES ────────────────────────────────────────── */}
      <MyWorkshops />

      {/* ── PROGRAMAS DE TRANSFORMACIÓN ─────────────────────── */}
      <section className="container-guarida py-26" id="programas">
        <div className="text-center mb-16">
          <p className="text-guarida-sky text-sm tracking-[0.3em] uppercase mb-4">
            Elegí tu camino
          </p>
          <h2 className="text-4xl md:text-5xl font-spiritual text-white">
            Programas de Transformación
          </h2>
          <br />
          <p className="text-white/90 text-lg">
            Incluyen cursos y talleres juntos para que empieces como necesites
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* PROGRAMA FLOR DE LOTO */}
          <div className="relative group p-8 rounded-3xl border border-sky/10 bg-guarida-sky/8 backdrop-blur-sm flex flex-col h-full transition-all hover:border-guarida-sky/30">
            <div className="mb-6">
              <span className="text-4xl mb-4 block">🪷</span>
              <h3 className="text-3xl font-spiritual text-white mb-2">
                Flor de Loto
              </h3>
              <p className="text-guarida-sky text-sm uppercase tracking-widest">
                Semestre de introspección
              </p>
            </div>

            <ul className="space-y-4 mb-12 grow text-white/80">
              <li className="flex items-start gap-3">
                <span className="text-guarida-sky">✓</span>
                <p>
                  Acceso a la plataforma por <strong>6 meses</strong>.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-guarida-sky">✓</span>
                <p>
                  Incluye curso <strong>"Amor Propio"</strong> y talleres{" "}
                  <strong>"Desata tu Voz"</strong> y{" "}
                  <strong>"Renacer del Abuso Narcisista"</strong>.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-guarida-sky">✓</span>
                <p>
                  <strong>8 encuentros</strong> de sesiones individuales (1 a
                  1).
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-guarida-sky">✓</span>
                <p>
                  1 encuentro grupal en el semestre para profundizar en los
                  talleres.
                </p>
              </li>
            </ul>

            <Link
              href="/contacto"
              className="w-full text-center py-4 rounded-xl border border-guarida-sky text-guarida-sky font-bold hover:bg-guarida-sky hover:text-guarida-violet transition-colors uppercase tracking-widest text-xs"
            >
              Más información
            </Link>
          </div>

          {/* PROGRAMA AVE FÉNIX */}
          <div className="relative group p-8 rounded-3xl border border-guarida-violet bg-linear-to-b from-guarida-violet/20 to-transparent flex flex-col h-full shadow-2xl shadow-guarida-violet/20">
            <div className="absolute -top-4 right-8 bg-guarida-fuchsia text-white px-6 py-2 rounded-full uppercase tracking-tighter font-semibold">
              Más Completo
            </div>

            <div className="mb-6">
              <span className="text-4xl mb-4 block">🔥</span>
              <h3 className="text-3xl font-spiritual text-white mb-2">
                Ave Fénix
              </h3>
              <p className="text-guarida-fuchsia text-sm uppercase tracking-widest">
                Un año de renacimiento
              </p>
            </div>

            <ul className="space-y-4 mb-12 grow text-white/90">
              <li className="flex items-start gap-3">
                <span className="text-guarida-fuchsia">-</span>
                <p>
                  Acceso por <strong>1 año</strong> a TODA la plataforma.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-guarida-fuchsia">-</span>
                <p>
                  <strong>Certificado</strong> de Danza Terapeuta Shaumbra.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-guarida-fuchsia">-</span>
                <p>
                  Un encuentro mensual de formación en Danza Terapéutica y Amor
                  Propio.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-guarida-fuchsia">-</span>
                <p>
                  2 encuentros especiales de profundización (Desata tu Voz y
                  Abuso Narcisista).
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-guarida-fuchsia">-</span>
                <p>
                  <strong>12 sesiones individuales</strong> (Mentoria, PNL,
                  Hipnosis y Coaching).
                </p>
              </li>
            </ul>

            <Link
              href="/contacto"
              className="w-full text-center py-4 rounded-xl bg-linear-to-r from-guarida-violet to-guarida-fuchsia text-white font-bold hover:brightness-110 transition-all uppercase tracking-widest text-xs shadow-lg shadow-guarida-fuchsia/20"
            >
              Comenzar mi transformación
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS DESTACADOS ───────────────────────────── */}
      <FeaturedProducts />

      {/* ── TESTIMONIOS ─────────────────────────────────────── */}
      <Testimonies />
    </main>
  );
}
