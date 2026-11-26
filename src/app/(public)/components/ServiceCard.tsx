import Link from "next/link";
import Image from "next/image";
import type { ProductType } from "@/core/entities/shared";

type ServiceCardProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
  srcImg: string;
  productType?: ProductType;
  priceArs?: number;
};

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  course: "Curso",
  workshop: "Taller",
  program: "Programa",
};

export default function ServiceCard({
  title,
  description,
  href,
  cta,
  srcImg,
  productType,
  priceArs = 0,
}: ServiceCardProps) {
  const imageSource = srcImg || "/logo.jpg";
  const typeLabel = productType ? PRODUCT_TYPE_LABELS[productType] : null;
  const formattedPrice = `$${priceArs.toFixed(2)}`;

  return (
    <div
      className="h-full relative z-10 w-fit overflow-hidden sm:w-80% shadow-guarida-fuchsia/19 hover:shadow-guarida-fuchsia/23 shadow-xl rounded-xl border 
                  transition-all duration-500
                  hover:scale-[1.01] cursor-pointer border-guarida-fuchsia/20 hover:border-guarida-fuchsia/30
                  bg-white/76 hover:bg-white"
    >
      <div className="flex flex-col items-center gap-4 p-2">
        <Image
          alt={title}
          className="md:h-auto object-cover max-w-full w-full rounded-xl"
          src={imageSource}
          width={140}
          height={140}
        />

        {/* Tipo, precio, título, descripción y CTA */}
        <div className="grow flex flex-col justify-between gap-1.5 h-full text-guarida-violet p-2">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold">
            {typeLabel && (
              <span className="uppercase tracking-wider text-guarida-fuchsia">
                {typeLabel}
              </span>
            )}
            <span className="text-guarida-violet/80">{formattedPrice}</span>
          </div>

          <h3
            className={`text-base md:text-xl font-semibold font-spiritual uppercase mb-0.5 
                        leading-tight whitespace-pre-line`}
          >
            {title}
          </h3>

          <p className="text-sm opacity-90 line-clamp-2">{description}</p>

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
