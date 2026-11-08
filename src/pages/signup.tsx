import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((state) => state.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await signUp(name, email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to create your account.");
      return;
    }

    if (result.needsConfirmation) {
      setNeedsConfirmation(true);
      return;
    }

    toast.success("Your YumGo account is ready!");
    navigate("/welcome/location");
  };

  if (needsConfirmation) {
    return (
      <AuthShell
        eyebrow="Almost there"
        title="Check your inbox"
        subtitle="Confirm your email address to finish creating your YumGo account."
      >
        <div className="rounded-3xl border border-line bg-white p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </span>
          <p className="mt-4 text-sm font-bold">Account created for {email}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Open the confirmation link we sent you, then sign in to start
            ordering. Check your spam folder if it does not arrive within a few
            minutes.
          </p>
          <Link
            to="/login"
            className="mt-5 flex h-12 items-center justify-center gap-1.5 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Go to sign in <ArrowRight size={17} />
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join YumGo"
      title="Create your account"
      subtitle="Save your addresses, reorder favourites and follow every delivery live."
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink" htmlFor="name">
            Full name
          </label>
          <div className="relative">
            <UserRound
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Thura"
              required
              className="h-12 w-full rounded-2xl border border-line bg-white pl-11 pr-4 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="h-12 w-full rounded-2xl border border-line bg-white pl-11 pr-4 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
              className="h-12 w-full rounded-2xl border border-line bg-white pl-11 pr-11 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold text-ink"
            htmlFor="confirm"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              required
              className="h-12 w-full rounded-2xl border border-line bg-white pl-11 pr-4 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-[11px] font-medium leading-relaxed text-rose-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Creating account...
            </>
          ) : (
            <>
              Create account <ArrowRight size={17} />
            </>
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
