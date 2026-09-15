import Link from "next/link";

const programsData = [
  {
    id: "flor-de-loto",
    title: "Flor de Loto",
    emoji: "🪷",
    subtitle: "Semestre de introspección",
    badge: null, // No lleva etiqueta destacada
    theme: {
      wrapper:
        "border-sky/10 bg-linear-to-b from-guarida-dark-violet to-transparent backdrop-blur-sm transition-all hover:border-guarida-sky/40 shadow-xl shadow-guarida-sky/10",
      subtitle: "text-guarida-sky",
      list: "text-white/80",
      check: "text-guarida-sky",
    },
    features: [
      <>
        Acceso a la plataforma por <strong>6 meses</strong>.
      </>,
      <>
        Incluye curso <strong>"Amor Propio"</strong> y talleres{" "}
        <strong>"Desata tu Voz"</strong> y{" "}
        <strong>"Renacer del Abuso Narcisista"</strong>.
      </>,
      <>
        <strong>8 sesiones individuales</strong> (Mentoria, PNL, Hipnosis y
        Coaching).
      </>,
      <>2 encuentros especiales de profundización de los talleres</>,
    ],
    buttonText: "Más información",
  },
  {
    id: "ave-fenix",
    title: "Ave Fénix",
    emoji: "🔥",
    subtitle: "Un año de renacimiento",
    badge: "Más Completo",
    theme: {
      wrapper:
        "border-guarida-gold/30 bg-linear-to-b from-guarida-violet/60 to-transparent shadow-xl shadow-guarida-gold/20",
      subtitle: "text-guarida-sky",
      list: "text-white/90",
      check: "text-guarida-sky",
    },
    features: [
      <>
        Acceso por <strong>1 año</strong> a TODA la plataforma.
      </>,
      <>
        <strong>Certificado</strong> de Danza Terapeuta Shaumbra.
      </>,
      <>
        Un encuentro mensual de formación en Danza Terapéutica y Amor Propio.
      </>,
      <>2 encuentros especiales de profundización de los talleres.</>,
      <>
        <strong>12 sesiones individuales</strong> (Mentoria, PNL, Hipnosis y
        Coaching).
      </>,
    ],
    buttonText: "Comenzar mi transformación",
  },
];

export default function TransformationPrograms() {
  return (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20">
        {programsData.map((program) => (
          <div
            key={program.id}
            className={`relative group p-8 rounded-3xl border flex flex-col h-full ${program.theme.wrapper}`}
          >
            {/* Badge de "Más Completo" o similares si existe */}
            {program.badge && (
              <div className="absolute -top-4 right-8 bg-linear-to-br from-amber-200 via-white to-amber-200 text-guarida-fuchsia px-6 py-2 rounded-full uppercase tracking-tighter font-semibold">
                {program.badge}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-3xl sm:text-4xl font-spiritual text-white mb-2 flex justify-between">
                {program.title}
                <span className="text-4xl mb-4 block">{program.emoji}</span>
              </h3>
              <p
                className={`text-sm uppercase tracking-widest ${program.theme.subtitle}`}
              >
                {program.subtitle}
              </p>
            </div>

            <ul className={`space-y-4 mb-12 grow ${program.theme.list}`}>
              {program.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className={program.theme.check}>✓</span>
                  <p>{feature}</p>
                </li>
              ))}
            </ul>

            <Link
              href="/contacto"
              className="w-full text-center py-4 rounded-xl bg-linear-to-r from-guarida-violet to-guarida-fuchsia text-white font-bold hover:brightness-110 transition-all uppercase tracking-widest text-xs shadow-lg shadow-guarida-fuchsia/20"
            >
              {program.buttonText}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
