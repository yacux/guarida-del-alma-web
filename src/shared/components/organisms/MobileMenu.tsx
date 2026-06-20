"use client";

import { useState } from "react";
import Link from "next/link";
import { MAIN_NAV_LINKS } from "@/shared/constants/navigation"; // Ajusta la ruta a tu proyecto

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* BOTÓN HAMBURGUESA */}
      <button
        className="block lg:hidden text-white focus:outline-none z-50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMenuOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12h18M3 6h18M3 18h18"
            />
          </svg>
        )}
      </button>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {isMenuOpen && (
        <nav className="absolute top-[90px] left-0 w-full bg-[#2a1738] lg:hidden flex flex-col items-center gap-6 py-8 shadow-xl border-t border-guarida-dark-violet/50">
          {/* ITERAMOS SOBRE LA CONSTANTE */}
          {MAIN_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-xl hover:text-guarida-sky transition"
            >
              {link.label}
            </Link>
          ))}

          {/* El botón de login suele manejarse separado porque tiene una UI y lógica distinta */}
          <Link
            href="/login"
            onClick={closeMenu}
            className="mt-2 bg-guarida-fuchsia text-white px-6 py-3 rounded-full hover:bg-fuchsia-600 transition flex items-center justify-center shadow-lg"
          >
            Ingresar a mi cuenta
          </Link>
        </nav>
      )}
    </>
  );
}
