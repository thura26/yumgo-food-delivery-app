import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bike,
  Code2,
  Database,
  Globe2,
  Heart,
  Map,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { PageHeader } from "@/components/page-header";
import { useCatalog } from "@/lib/use-catalog";

const stack = [
  {
    icon: <Code2 size={17} />,
    title: "React 19 + Vite",
    text: "React Router SPA, TypeScript and a fully responsive design system.",
  },
  {
    icon: <Database size={17} />,
    title: "Supabase backend",
    text: "Accounts, catalog, orders and addresses live in Supabase with row-level security.",
  },
  {
    icon: <Map size={17} />,
    title: "Leaflet + OpenStreetMap",
    text: "Live rider movement, delivery pins and address picking on an open map.",
  },
  {
    icon: <ShieldCheck size={17} />,
    title: "Cash on delivery",
    text: "Pay the rider when your order arrives. No card details are collected or stored.",
  },
];

export default function AboutPage() {
  const catalog = useCatalog();
  const dishCount = catalog.reduce(
    (total, restaurant) =>
      total +
      restaurant.categories.reduce(
        (sum, category) => sum + category.items.length,
        0,
      ),
    0,
  );
  const stats = [
    { value: String(catalog.length), label: "Partner kitchens" },
    { value: String(dishCount), label: "Menu dishes" },
    { value: "20–30 min", label: "Typical delivery" },
    { value: "Live", label: "Rider tracking" },
  ];

  return (
    <div className="pb-6">
      <PageHeader title="About YumGo" subtitle="Good food, closer to you." />

      <div className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] bg-brand p-6 text-white shadow-soft sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#7FE3AA]/20 blur-3xl" />
          <div className="relative">
            <BrandLogo size={48} variant="light" />
            <h1 className="mt-5 max-w-md text-3xl font-extrabold leading-[1.02] tracking-[-0.05em] sm:text-[42px]">
              Good food,
              <br />
              closer to you.
            </h1>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-white/75 sm:text-sm">
              YumGo brings Yangon&apos;s local kitchens to your door. Browse
              menus, order in a few taps, pay cash on delivery and follow your
              rider live on the map.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to="/home"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-brand transition hover:bg-cream"
              >
                Explore the app <ArrowRight size={14} />
              </Link>
              <Link
                to="/restaurants"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/25 px-4 text-xs font-bold text-white/90 transition hover:bg-white/10"
              >
                Browse restaurants <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-line bg-white p-3.5 text-center shadow-card"
            >
              <p className="text-xl font-extrabold tracking-tight text-brand sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-4 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="relative h-[190px] sm:h-[260px]">
            <Image
              src="/images/hero-bowl.jpg"
              alt="Burmese chicken rice bowl"
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">
                  The idea
                </p>
                <p className="mt-1 max-w-xs text-sm font-extrabold leading-snug text-white sm:text-base">
                  Local kitchens deserve a beautiful storefront.
                </p>
              </div>
              <span className="hidden items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-ink sm:inline-flex">
                <Bike size={11} className="text-brand" /> Live tracking
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[11px] leading-relaxed text-muted sm:text-xs">
              The goal was simple: design a food delivery app that feels warm,
              fast and trustworthy. YumGo pairs a cream-and-green visual language
              with big food photography, playful motion and practical flows that
              work just as well on a 390px phone as they do on a desktop.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                {
                  icon: <UtensilsCrossed size={15} />,
                  title: "Local first",
                  text: "Burmese classics sit next to Korean chicken, pizza and bubble tea.",
                },
                {
                  icon: <Bike size={15} />,
                  title: "Live by default",
                  text: "Every order gets a rider, a moving map pin and a status timeline.",
                },
                {
                  icon: <Heart size={15} />,
                  title: "Pocket friendly",
                  text: "MMK pricing, clear fees and promo codes that are easy to find.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl bg-cream/70 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                    {item.icon}
                  </span>
                  <p className="mt-2 text-[11px] font-extrabold">{item.title}</p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            Under the hood
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight">
            Built with a modern stack
          </h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {stack.map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                  {item.icon}
                </span>
                <div>
                  <p className="text-[11px] font-extrabold">{item.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              <Globe2 size={12} className="text-brand" /> Design language
            </p>
            <div className="mt-3 flex items-center gap-2">
              {["#00B14F", "#FFF8F3", "#171717", "#F4B740", "#2F9E63"].map(
                (color) => (
                  <span
                    key={color}
                    className="h-8 flex-1 rounded-xl border border-black/5"
                    style={{ background: color }}
                    title={color}
                  />
                ),
              )}
            </div>
            <p className="mt-2.5 text-[10px] leading-relaxed text-muted">
              Brand green, warm cream, deep ink and a Plus Jakarta Sans type
              scale. Rounded cards and soft shadows keep the interface friendly.
            </p>
          </div>
          <div className="rounded-3xl border border-dashed border-brand/30 bg-brand-soft/30 p-4">
            <p className="text-sm font-extrabold">Built for real orders</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Restaurants, menus, orders and addresses are served from Supabase.
              Access is protected by row-level security, and payment is collected
              in cash when the rider arrives.
            </p>
            <Link
              to="/profile"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand"
            >
              Back to profile <ArrowRight size={12} />
            </Link>
          </div>
        </section>

        <p className="mt-5 text-center text-[9px] text-muted/60">
          YumGo · Good food, closer to you · v1.0 · 2026
        </p>
      </div>
    </div>
  );
}
