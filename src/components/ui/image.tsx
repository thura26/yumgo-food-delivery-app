import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height"
> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  width?: number | string;
  height?: number | string;
  sizes?: string;
  quality?: number;
  placeholder?: "empty" | "blur";
  blurDataURL?: string;
};

/**
 * A small drop-in replacement for `next/image`.
 *
 * The app does not run an image optimiser (the original Next config used
 * `images.unoptimized`), so a plain `<img>` keeps the same behaviour while
 * making the project portable to any React bundler.
 */
export function Image({
  fill,
  priority,
  unoptimized: _unoptimized,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  width,
  height,
  className,
  loading,
  ...props
}: ImageProps) {
  return (
    <img
      {...props}
      width={width}
      height={height}
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cn(
        fill ? "absolute inset-0 h-full w-full" : undefined,
        className,
      )}
    />
  );
}
