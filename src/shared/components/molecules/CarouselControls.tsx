//Solo maneja la lógica de las flechas y los puntos de un carrusel.
interface CarouselControlsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  color?: "fuchsia" | "sky"; // Para manejar tus dos estilos
}

export const CarouselControls = ({
  current,
  total,
  onPrev,
  onNext,
  onSelect,
  color = "fuchsia",
}: CarouselControlsProps) => {
  // Mapeo de colores para no repetir condicionales largos
  const colorStyles = {
    fuchsia: {
      active: "bg-guarida-fuchsia",
      inactive: "bg-guarida-fuchsia/30 hover:bg-guarida-fuchsia/50",
      arrow:
        "border-guarida-fuchsia/30 text-guarida-fuchsia hover:border-guarida-fuchsia hover:bg-guarida-fuchsia/5",
    },
    sky: {
      active: "bg-guarida-sky",
      inactive: "bg-white/30 hover:bg-white/50",
      arrow:
        "border-white/30 text-white hover:border-guarida-sky hover:bg-white/10",
    },
  };

  const style = colorStyles[color];

  return (
    <div className="flex items-center justify-center gap-6 mt-10">
      {/* Flecha Izquierda */}
      <button
        onClick={onPrev}
        className={`w-11 h-11 rounded-full border transition-all duration-200 flex items-center justify-center text-lg cursor-pointer ${style.arrow}`}
      >
        ←
      </button>

      {/* Puntitos (Dots) */}
      <div className="flex gap-2" role="tablist">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            onClick={() => onSelect(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? `w-8 ${style.active}` : `w-2 ${style.inactive}`
            }`}
          />
        ))}
      </div>

      {/* Flecha Derecha */}
      <button
        onClick={onNext}
        className={`w-11 h-11 rounded-full border transition-all duration-200 flex items-center justify-center text-lg cursor-pointer ${style.arrow}`}
      >
        →
      </button>
    </div>
  );
};
