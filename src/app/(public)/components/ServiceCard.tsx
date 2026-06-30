import Link from "next/link";
import Image from "next/image";

type serviceProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
  srcImg: string;
};

// ServiceCard.tsx - layout horizontal (ícono izquierda + texto + botón derecha)
export default function ServiceCard({
  title,
  description,
  href,
  cta,
  srcImg,
}: serviceProps) {
  const imageSource = srcImg || "/logo.jpg"; // Ruta de imagen por defecto si no se proporciona srcImg
  return (
    <div
      className="h-full relative z-10 w-full sm:mr-auto sm:w-80% shadow-guarida-fuchsia/19 shadow-xl rounded-xl border p-4 md:p-6
                  transition-all duration-500
                  hover:scale-[1.01] cursor-pointer border-white hover:border-white
                  bg-white/76 hover:bg-white"
    >
      <div className="h-44 flex items-center gap-4">
        <Image
          alt="imagen de servicio"
          className="rounded-full object-cover h-90% w-90% md:h-full md:w-auto aspect-square"
          src={imageSource}
          width={140}
          height={140}
        />

        {/* Título y descripción al centro */}
        <div className="grow flex flex-col justify-between gap-2 h-full text-guarida-violet">
          <h3
            className={`text-base md:text-xl font-semibold font-spiritual uppercase mb-1 
                        leading-tight whitespace-pre-line`}
          >
            {title}
          </h3>
          <p className={`opacity-90 line-clamp-2`}>{description}</p>
          <Link
            href={href}
            className="shrink-0 inline-block mr-auto  
                     px-5 py-2 rounded-full bg-guarida-fuchsia text-white text-sm font-medium tracking-wide
                     hover:brightness-125 transition-all whitespace-pre-line text-center shadow-lg active:scale-95"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
