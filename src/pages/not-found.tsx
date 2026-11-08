import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-white p-7 text-center shadow-soft">
        <div className="flex justify-center">
          <BrandLogo size={46} />
        </div>
        <span className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
          <Compass size={26} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.04em]">
          Page not found
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          The page you are looking for does not exist or has moved.
        </p>
        <Link
          to="/home"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          <Home size={16} /> Back to home
        </Link>
      </div>
    </main>
  );
}
