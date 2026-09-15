import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  // Mapeamos las 3 columnas principales
  const footerColumns = [
    {
      title: "La Guarida del Alma",
      content: (
        <p className="text-white/80 text-sm leading-relaxed">
          Un espacio para tu bienestar integral. Danza terapia, bioneuroemoción,
          coaching y más.
        </p>
      ),
    },
    {
      title: "Contacto",
      content: (
        <div className="text-white/80 text-sm flex flex-col gap-1">
          <span>Teléfono:</span>
          <Link
            href="https://wa.me/5491144396843"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-guarida-fuchsia transition-colors duration-300 font-medium"
          >
            +54 9 11 4439-6843
          </Link>
        </div>
      ),
    },
    {
      title: "Seguime",
      content: (
        <div className="flex gap-5 pt-1">
          <Link
            href="https://www.facebook.com/people/hebedelvallegomez/100070130149353/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl hover:text-guarida-fuchsia transition-all duration-300 hover:scale-110 hover:-translate-y-1"
          >
            <FaFacebook />
          </Link>
          <Link
            href="https://www.instagram.com/hebecoachwellness/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl hover:text-guarida-fuchsia transition-all duration-300 hover:scale-110 hover:-translate-y-1"
          >
            <FaInstagram />
          </Link>
          <Link
            href="https://wa.me/5491144396843"
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl hover:text-guarida-fuchsia transition-all duration-300 hover:scale-110 hover:-translate-y-1"
          >
            <FaWhatsapp />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <footer className="bg-guarida-dark/80 z-40 text-white pt-12 pb-6 mt-12 border-t border-slate-700">
      <div className="container-guarida mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
        {footerColumns.map((col, index) => (
          <div
            key={index}
            // Agregamos el separador vertical en pantallas medianas/grandes
            className="flex flex-col md:border-r border-slate-700 md:pr-6"
          >
            <h3 className="text-xl font-bold mb-4 text-guarida-violet tracking-wide">
              {col.title}
            </h3>
            {col.content}
          </div>
        ))}

        {/* LOGO - Cuarta columna sin mapear */}
        <Link
          href="/"
          className="hidden group md:flex flex-col items-center gap-3 transition-transform duration-300 hover:scale-105"
        >
          <Image
            src="/logoTerminado.png"
            alt="Logo La Guarida del Alma"
            width={80}
            height={80}
            className="aspect-square h-full w-auto rounded-full shadow-lg border-2 border-transparent group-hover:border-guarida-fuchsia transition-colors duration-300"
          />
          <span className="hidden text-xl uppercase font-semibold font-spiritual text-guarida-violet group-hover:text-guarida-fuchsia transition-colors duration-300 text-center">
            La Guarida <br /> del Alma
          </span>
        </Link>
      </div>

      {/* Footer inferior (Copyright) */}
      <div className="container-guarida mx-auto px-6 text-center mt-12 pt-6 border-t border-slate-700">
        <p className="text-sm text-white/60">
          &copy; {new Date().getFullYear()} La Guarida del Alma. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
}
