import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus, PaymentMethod, Promotion } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMMK(value: number) {
  return `Ks ${Math.round(value).toLocaleString("en-US")}`;
}

export function formatDate(date: string | Date, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hour12: true }
      : {}),
  });
}

export function formatTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(d);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "#00B14F",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#0EA5E9",
  "#14B8A6",
  "#F43F5E",
];

export function colorFromString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; dot: string; description: string }
> = {
  pending_payment: {
    label: "Pending payment",
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    description: "Waiting for payment confirmation",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    description: "Your order has been received",
  },
  preparing: {
    label: "Preparing",
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    description: "The kitchen is preparing your food",
  },
  on_the_way: {
    label: "On the way",
    className: "bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
    description: "Your rider is on the way",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    description: "Enjoy your meal!",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    description: "This order was cancelled",
  },
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
};

export function calculateDiscount(promo: Promotion | undefined, subtotal: number) {
  if (!promo || !promo.isActive) return 0;
  if (subtotal < promo.minOrder) return 0;
  const raw =
    promo.type === "percentage"
      ? Math.round((subtotal * promo.value) / 100)
      : promo.value;
  if (promo.maxDiscount) return Math.min(raw, promo.maxDiscount);
  return Math.min(raw, subtotal);
}

export function generateOrderCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `YG-${y}${m}${d}-${rand}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function slugify(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "restaurant";
}
