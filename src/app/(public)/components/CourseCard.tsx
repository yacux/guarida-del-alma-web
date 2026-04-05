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

export default function CourseCard({ course }: { course: CourseProps }) {
  return (
    <div
      className={`relative z-10 h-full w-full p-10 rounded-2xl border border-white/10 
                      backdrop-blur-md transition-all duration-500
                      group-hover:scale-[1.02] group-hover:border-white/20
                      ${course.glowColor} 
                      ${course.bgColor}`}
    >
      <div className="text-center">
        {course.icon && <div className="mb-6 opacity-80 ">{course.icon}</div>}

        <h3
          className={`text-xl md:text-2xl font-spiritual uppercase mb-4 leading-tight whitespace-pre-line ${course.colorText}`}
        >
          {course.title}
        </h3>

        <p className={`mb-8 text-sm md:text-base ${course.colorText}`}>
          {course.description}
        </p>

        <Link
          href={course.href}
          className="inline-block bg-guarida-violet  
                       px-10 py-3 rounded-full text-white font-medium tracking-wide
                       hover:brightness-125 transition-all shadow-lg active:scale-95"
        >
          {course.cta}
        </Link>
      </div>
    </div>
  );
}
