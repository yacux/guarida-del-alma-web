import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const buttonVariants = cva(
  "uppercase cursor-pointer whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-guarida-fuchsia hover:bg-guarida-violet text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105",
        sky: "border border-guarida-sky text-guarida-sky hover:bg-guarida-sky/30 hover:text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase transition-all duration-300",
        destructive: "bg-red-900 text-brand-white hover:bg-red-800",

        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-blue-700 text-white hover:bg-blue-700",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1 text-xs",
        lg: "px-8 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// este tipado hace que Button tome todas las Props propias de un button html
// y tambien hace que tome las props "VariantProps" definidas arriba.
// es decir variant, size y defaultVariants.
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={clsx(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
// <Link href="/sesiones" className="">
//   Reservar mi lugar
// </Link>;
