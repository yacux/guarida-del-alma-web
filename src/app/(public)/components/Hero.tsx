import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="z-30 h-screen relative flex flex-col justify-between items-center text-center py-20 overflow-hidden bg-linear-to-r from-guarida-violet via-guarida-dark-violet to-guarida-dark-violet"
      aria-label="Bienvenida"
    >
      <div className="lights-container">
        <Image
          src="/lights-1.png.webp"
          alt="alma"
          width={550}
          height={550}
          className="aspect-square light-beam animate-light-1 h-full "
        />
        <Image
          src="/lights-2.png.webp"
          alt="alma"
          width={550}
          height={550}
          className="aspect-square light-beam animate-light-2 h-[90%]"
        />
      </div>
      {/* Contenido */}
      <div className="container-guarida z-10 flex flex-col justify-center h-full  text-guarida-sky space-y-16">
        <br />
        <br />
        {/* Tagline superior */}
        <p className="text-xs sm:text-sm tracking-[0.4em] uppercase">
          Bienestar · Sanación · Consciencia
        </p>

        {/* Título principal */}
        <h1 className="font-spiritual text-3xl sm:text-3xl md:text-6xl lg:text-8xl font-light leading-none bg-linear-to-b from-guarida-sky via-guarida-sky to-guarida-violet uppercase bg-clip-text text-transparent">
          La Guarida del Alma
        </h1>

        {/* Bajada */}
        <p className="text-lg sm:text-xl font-light text-white tracking-wide max-w-xl mx-auto mb-16 leading-relaxed">
          Un espacio para encontrarte con vos mismo,
          <br />
          sanar desde la raíz y vivir con plenitud.
        </p>

        {/* CTAs */}
        <div className="mt-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cursos"
            className="bg-guarida-fuchsia hover:bg-guarida-violet text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105"
          >
            Explorar cursos
          </Link>
          <Link
            href="#sobre-hebe"
            className="border border-guarida-sky text-guarida-sky hover:bg-guarida-sky/30 hover:text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-300"
          >
            Conocé a Hebe
          </Link>
        </div>
      </div>
    </section>
  );
}
