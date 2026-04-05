import Link from "next/link";

type CourseProps = {
  title: string;
  colorText?: string;
  description: string;
  href: string;
  cta: string;
  bgColor: string;
  glowColor: string; // Nueva propiedad para el efecto neón
  icon?: React.ReactNode; // Opcional por si quieres añadir iconos como en la imagen
};

// ServiceCard.tsx - layout horizontal (ícono izquierda + texto + botón derecha)
export default function ServiceCard({ course }: { course: CourseProps }) {
  return (
    <div
      className={`relative z-10 w-full px-6 py-10 rounded-2xl border border-white/10 
                  backdrop-blur-md transition-all duration-500
                  hover:scale-[1.02] hover:border-white/20
                  ${course.glowColor} 
                  ${course.bgColor}`}
    >
      <div className="flex items-center gap-4">
        {/* Ícono circular a la izquierda */}
        {course.icon && (
          <div className="flex items-center justify-center opacity-80">
            {course.icon}
          </div>
        )}

        {/* Título y descripción al centro */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-base md:text-xl font-semibold font-spiritual uppercase mb-1 
                        leading-tight whitespace-pre-line ${course.colorText}`}
          >
            {course.title}
          </h3>
          <p className={`text-sm ${course.colorText} opacity-70 line-clamp-2`}>
            {course.description}
          </p>
        </div>

        {/* Botón "Ver" a la derecha */}
        <Link
          href={course.href}
          className="shrink-0 inline-block bg-guarida-violet  
                     px-5 py-2 rounded-full text-white text-sm font-medium tracking-wide
                     hover:brightness-125 transition-all shadow-lg active:scale-95"
        >
          {course.cta}
        </Link>
      </div>
    </div>
  );
}
