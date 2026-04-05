import Link from "next/link";
import MyCourses from "./components/MyCourses";

export default function Home() {
  const workshopsBenefits = [
    {
      label: "Disponibilidad",
      info: "6 meses de acceso al contenido grabado.",
    },
    {
      label: "Sesión en vivo",
      info: "Encuentro de integración incluido en el programa.",
    },
  ];
  return (
    <main className=" text-guari font-sans">
      {/* 1. HERO - Místico y Minimalista */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-6 sticky top-0">
        <h1 className="font-spiritual text-6xl md:text-8xl mb-4 uppercase bg-linear-to-b from-guarida-violet via-guarida-violet to-guarida-sky via-60% bg-clip-text text-transparent">
          la guarida del alma
        </h1>
        <p className="text-xl md:text-2xl font-light tracking-widest uppercase">
          Sanación · Movimiento · Consciencia
        </p>
        <div className="mt-12 text-5xl text-fuchsia-50 animate-bounce opacity-50">
          ↓
        </div>
      </section>

      {/* 2. CURSOS PRINCIPALES - Diseño Split (Pantalla Dividida) */}
      <MyCourses />

      {/* 3. TALLERES DE VIDEO - Formato "Netflix Style" */}
      <section className="relative py-10 bg-slate-900">
        <div className="relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-spiritual text-white">
            Participá en mis talleres
          </h2>
          <br />
          {/* Lista de beneficios */}
          <ul className="space-y-3 text-guarida-fuchsia/80 text-center text-sm leading-relaxed">
            {workshopsBenefits.map((item, index) => (
              <li
                key={`workshop-benefit-${index}`}
                className="flex items-start justify-center gap-2"
              >
                <span className="text-guarida-fuchsia">•</span>
                <span>
                  <strong className="text-guarida-fuchsia font-medium">
                    {item.label}:
                  </strong>{" "}
                  {item.info}
                </span>
              </li>
            ))}
          </ul>
          <br />
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Taller 1 y 2 representados como Cards Horizontales */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-950/50 p-6 rounded-xl border border-white/5 flex gap-6 items-center max-w-lg hover:border-guarida-sky/50 transition"
            >
              <div className="w-24 h-24 bg-slate-800 rounded-lg" />
              <div>
                <h4 className="text-xl font-bold">Taller de Video #{i}</h4>
                <p className="text-sm text-slate-400">
                  Acceso inmediato y de por vida.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SESIONES INDIVIDUALES - El espacio de calma */}
      <section className="relative py-10 text-center bg-guarida-violet">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-spiritual text-white">
            Acompañamiento Individual
          </h3>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            Bioneuroemoción, Coaching y PNL. Un espacio uno a uno diseñado para
            desatar nudos y encontrar claridad en tu proceso personal.
          </p>
          <Link
            href="/sesiones"
            className="bg-white text-black px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Reservar mi lugar
          </Link>
        </div>
      </section>

      {/* 5. PRODUCTOS - Minimalismo de marca */}
      <section className="relative py-24 border-t border-slate-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <h2 className="text-3xl font-spiritual">Bazar Holístico</h2>
          <Link
            href="/productos"
            className="text-guarida-fuchsia hover:underline"
          >
            Ver todas las agendas y ropa →
          </Link>
        </div>
      </section>
    </main>
  );
}
