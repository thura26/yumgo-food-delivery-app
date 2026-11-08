import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  size = 40,
  color,
  image,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  image?: string;
  className?: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color ?? "#00B14F",
        fontSize: size * 0.36,
      }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarGroup({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, 4).map((name, index) => (
        <Avatar
          key={name + index}
          name={name}
          size={28}
          color={["#00B14F", "#F4B740", "#3B82F6", "#8B5CF6"][index % 4]}
          className="ring-2 ring-white"
        />
      ))}
    </div>
  );
}
