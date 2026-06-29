"use client";

import { useState } from "react";
import Link from "next/link";
import { MAIN_NAV_LINKS } from "@/shared/constants/navigation"; // Ajusta la ruta a tu proyecto

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* BOTÓN HAMBURGUESA / X */}
      <button
        className="fixed top-6 right-6 lg:hidden text-white focus:outline-none z-50 p-2 hover:scale-105 transition-transform"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
      >
        {isMenuOpen ? (
          /* ICONO DE EQUIS (X) */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5} /* Un poco más grueso para que resalte */
            stroke="currentColor"
            className="w-8 h-8 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          /* ICONO HAMBURGUESA */
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
      <nav
        className={`fixed top-0 right-0 w-full h-screen bg-guarida-dark-violet lg:hidden flex flex-col items-center justify-center shadow-xl z-40 transform transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible"
        }`}
      >
        {/* CONTENEDOR DE ENLACES */}
        <div className="flex flex-col items-center gap-8 w-full px-6">
          {MAIN_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-2xl font-medium text-white/90 hover:text-guarida-sky transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Botón de login */}
          <Link
            href="/login"
            onClick={closeMenu}
            className="mt-4 w-full max-w-xs bg-guarida-fuchsia text-white px-6 py-3 rounded-full hover:bg-fuchsia-600 transition-all flex items-center justify-center shadow-lg font-semibold"
          >
            Ingresar a mi cuenta
          </Link>
        </div>
      </nav>
    </>
  );
}
