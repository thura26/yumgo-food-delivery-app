import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "dark";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-soft hover:bg-brand-dark active:scale-[0.98]",
  secondary:
    "bg-brand-soft text-brand-dark hover:bg-[#D3F2E0] active:scale-[0.98]",
  outline:
    "border border-line bg-white text-ink hover:border-brand/30 hover:bg-cream active:scale-[0.98]",
  ghost: "bg-transparent text-ink hover:bg-black/5 active:scale-[0.98]",
  dark: "bg-ink text-white hover:bg-black active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-full px-4 text-[13px]",
  md: "h-11 rounded-full px-5 text-sm",
  lg: "h-13 rounded-full px-6 text-[15px]",
  icon: "h-10 w-10 rounded-full",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}
