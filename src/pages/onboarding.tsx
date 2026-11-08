import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function Onboarding() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-[#7FE3AA]/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full border border-white/10" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <header className="flex items-center justify-between">
          <BrandLogo size={44} variant="light" />
          <Link
            to="/home"
            className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
          >
            Skip
          </Link>
        </header>

        <div className="mt-8 grid flex-1 items-center gap-8 lg:mt-4 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
              <Sparkles size={12} />
              Yangon&apos;s local food, delivered
            </span>

            <h1 className="mt-5 text-balance text-[42px] font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-[62px] lg:text-[68px]">
              Good food,
              <br />
              <span className="text-white/70">closer to you.</span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base lg:mx-0">
              Discover Yangon&apos;s best local kitchens, order in a few taps and
              follow your rider live — from kitchen to your door.
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link
                to="/home"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-brand shadow-xl shadow-black/10 transition hover:bg-cream active:scale-[0.98]"
              >
                Get started
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-13 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-7 flex items-center justify-center gap-5 text-[10px] text-white/70 lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={13} /> 30 min average
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5">
                <Bike size={13} /> Live tracking
              </span>
              <span className="hidden h-3 w-px bg-white/20 sm:block" />
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <ShieldCheck size={13} /> Secure checkout
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[420px] lg:max-w-[500px]"
          >
            <div className="relative aspect-square">
              <div className="absolute inset-4 rotate-6 rounded-[42%_58%_55%_45%/48%_38%_62%_52%] bg-white/10" />
              <div className="absolute inset-0 animate-float overflow-hidden rounded-[46%_54%_58%_42%/52%_44%_56%_48%] border border-white/20 shadow-2xl shadow-black/20">
                <Image
                  src="/images/hero-bowl.jpg"
                  alt="A bowl of Burmese chicken rice"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 500px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -left-2 top-[16%] rounded-2xl bg-white px-3 py-2 text-ink shadow-xl sm:-left-5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                    <Clock3 size={13} />
                  </span>
                  <div>
                    <p className="text-[11px] font-extrabold leading-none">
                      20–30 min
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted">
                      Typical delivery
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 }}
                className="absolute -right-2 bottom-[18%] rounded-2xl bg-white px-3 py-2 text-ink shadow-xl sm:-right-5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Bike size={14} />
                  </span>
                  <div>
                    <p className="text-[11px] font-extrabold leading-none">On the way</p>
                    <p className="mt-0.5 text-[9px] text-muted">Arriving in 8 min</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink/90 px-4 py-2 text-[10px] font-semibold text-white shadow-xl backdrop-blur"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live rider tracking
              </motion.div>
            </div>
          </motion.div>
        </div>

        <footer className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-white/15 pt-4 text-[10px] text-white/50 sm:flex-row">
          <p>YumGo · Good food, closer to you</p>
          <p>Built with React, Vite, Supabase & OpenStreetMap</p>
        </footer>
      </div>
    </main>
  );
}
