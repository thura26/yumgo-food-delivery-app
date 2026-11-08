import { cn } from "@/lib/utils";

export function BrandMark({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[30%] bg-brand text-white shadow-soft",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        width={size * 0.66}
        height={size * 0.66}
        fill="none"
      >
        <path
          d="M5.5 14.5h21c0 6.5-4.7 11.5-10.5 11.5S5.5 21 5.5 14.5Z"
          fill="currentColor"
        />
        <path
          d="M10.5 10.5c0-2 1.3-2.8 1.3-4.8M15.8 10.5c0-2 1.3-2.8 1.3-4.8M21.1 10.5c0-2 1.3-2.8 1.3-4.8"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M22.4 11.2 27 15.8"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function BrandLogo({
  size = 40,
  variant = "dark",
  showWordmark = true,
  className,
}: {
  size?: number;
  variant?: "dark" | "light";
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {showWordmark && (
        <span
          className={cn(
            "text-[22px] font-extrabold tracking-[-0.04em]",
            variant === "light" ? "text-white" : "text-ink",
          )}
        >
          Yum
          <span className={variant === "light" ? "text-white/80" : "text-brand"}>
            Go
          </span>
        </span>
      )}
    </span>
  );
}
