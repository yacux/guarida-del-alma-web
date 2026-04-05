import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-white text-violet-600 p-1 shadow-md flex fixed h-[13vh] w-full z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="my-auto flex items-center gap-2">
          <Image
            src="/logo2.png"
            alt="Logo"
            width={80}
            height={80}
            className="rounded-full"
          />
          <span className="text-2xl uppercase font-semibold font-spiritual text-guarida-violet">
            la guarida del alma
          </span>
        </Link>
        <nav className="">
          <ul className="flex items-center gap-6 text-lg">
            <li>
              <Link
                href="/cursos"
                className="hover:text-fuchsia-500 transition"
              >
                Cursos y talleres
              </Link>
            </li>

            <li>
              <Link
                href="/sesiones"
                className="hover:text-fuchsia-500 transition"
              >
                Sesiones
              </Link>
            </li>
            <li>
              <Link
                href="/productos"
                className="hover:text-fuchsia-500 transition"
              >
                Productos
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="bg-violet-600 text-white px-4 py-2 rounded-full hover:bg-fuchsia-600 transition"
              >
                Iniciar Sesión
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
