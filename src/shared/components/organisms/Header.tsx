import Link from "next/link";
import Image from "next/image";
import MobileMenu from "./MobileMenu";
import { MAIN_NAV_LINKS } from "@/shared/constants/navigation"; // Ajusta la ruta

export default function Header() {
  return (
    <header className="bg-linear-to-b from-guarida-dark-violet/92 via-guarida-dark-violet/58 via-40% to-transparent text-white pt-2 pb-20 flex fixed top-0 w-full z-50">
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-0">
        {/* LOGO */}
        <Link href="/" className="my-auto h-full flex items-center gap-2">
          <Image
            src="/logo2.png"
            alt="Logo"
            width={80}
            height={80}
            className="aspect-square h-17 w-17 sm:h-21 sm:w-21 rounded-full"
          />
          <span className="hidden text-2xl uppercase font-semibold font-spiritual text-guarida-violet">
            la guarida del alma
          </span>
        </Link>

        {/* NAVEGACIÓN DESKTOP */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-6 text-lg">
            {/* ITERAMOS SOBRE LA CONSTANTE */}
            {MAIN_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-guarida-sky transition"
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li>
              <Link
                href="/login"
                className="bg-guarida-fuchsia text-white w-11 h-11 rounded-full hover:bg-fuchsia-600 transition flex items-center justify-center shadow-lg hover:shadow-fuchsia-500/20"
                aria-label="Ingresar a mi cuenta"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </Link>
            </li>
          </ul>
        </nav>

        {/* COMPONENTE CLIENTE PARA MÓVILES */}
        <MobileMenu />
      </div>
    </header>
  );
}
