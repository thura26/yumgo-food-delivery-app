import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { ArrowLeft, Bike, ShieldCheck, Star } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#7FE3AA]/20 blur-3xl" />
        <Link to="/" className="relative z-10">
          <BrandLogo size={46} variant="light" />
        </Link>

        <div className="relative z-10 mt-16 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
            <Star size={12} className="fill-warning text-warning" />
            Good food, closer to you
          </span>
          <h2 className="mt-5 text-[44px] font-extrabold leading-[1.02] tracking-[-0.05em]">
            Your next
            <br />
            favourite meal
            <br />
            <span className="text-white/65">is one tap away.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Order from Yangon&apos;s best local kitchens, pay cash on delivery
            and track your rider in real time.
          </p>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/10 p-2 backdrop-blur">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[24px]">
              <Image
                src="/images/hero-bowl.jpg"
                alt="Burmese food bowl"
                fill
                priority
                sizes="520px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 text-ink shadow-xl backdrop-blur">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                  Delivering now
                </p>
                <p className="mt-0.5 text-sm font-extrabold">
                  Live rider tracking
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
                <Bike size={18} />
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-5 text-[10px] text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} /> Secure sign-in
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star size={13} /> Cash on delivery
            </span>
          </div>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-16 lg:py-10">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/">
            <BrandLogo size={40} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted"
          >
            <ArrowLeft size={13} /> Back
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-10 lg:py-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-[38px]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>

        <p className="mx-auto w-full max-w-[430px] text-center text-[10px] text-muted/70 lg:text-left">
          YumGo · Good food, closer to you
        </p>
      </section>
    </main>
  );
}
