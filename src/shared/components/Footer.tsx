import Link from "next/link";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white p-8 mt-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-2xl font-bold mb-4 text-guarida-violet">
            La Guarida del Alma{" "}
          </h3>
          <p>
            Un espacio para tu bienestar integral. Danza terapia,
            bioneuroemoción, coaching y más.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4 text-guarida-violet">
            Contacto
          </h3>
          <p>Teléfono: +54 9 11 4439-6843</p>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4 text-guarida-violet">
            Síguenos
          </h3>
          <div className="flex gap-4">
            <Link
              href="https://www.facebook.com/people/hebedelvallegomez/100070130149353/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl hover:text-guarida-fuchsia"
            >
              <FaFacebook />
            </Link>
            <Link
              href="https://www.instagram.com/hebecoachwellness/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl hover:text-guarida-fuchsia"
            >
              <FaInstagram />
            </Link>
            <Link
              href="https://wa.me/5491144396843"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl hover:text-guarida-fuchsia"
            >
              <FaWhatsapp />
            </Link>
          </div>
        </div>
      </div>
      <div className="text-center mt-8 pt-4 border-t border-slate-700">
        <p>
          &copy; {new Date().getFullYear()} La Guarida del Alma. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
}
