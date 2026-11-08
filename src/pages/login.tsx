import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const requestPasswordReset = useAuthStore(
    (state) => state.requestPasswordReset,
  );
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const resetMode = searchParams.get("reset") === "1";
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  const destination = next?.startsWith("/") ? next : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Unable to sign in.");
      return;
    }
    toast.success(`Welcome back${result.user ? `, ${result.user.name}` : ""}!`);
    navigate(
      destination ?? (result.user?.role === "admin" ? "/admin" : "/home"),
    );
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address first, then request a reset link.");
      return;
    }
    setError("");
    const result = await requestPasswordReset(email);
    if (result.ok) {
      toast.success(result.message ?? "Password reset email sent.");
    } else {
      setError(result.message ?? "Could not send the reset email.");
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setResetting(true);
    const result = await updatePassword(newPassword);
    setResetting(false);

    if (!result.ok) {
      setError(result.message ?? "Could not update your password.");
      return;
    }

    toast.success("Password updated. Sign in with your new password.");
    navigate("/login", { replace: true });
  };

  if (resetMode) {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title="Choose a new password"
        subtitle="Set a new password for your YumGo account, then sign in again."
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label
              className="mb-1.5 block text-[11px] font-bold text-ink"
              htmlFor="new-password"
            >
              New password
            </label>
            <div className="relative">
              <Lock
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
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
              htmlFor="confirm-password"
            >
              Confirm new password
            </label>
            <div className="relative">
              <Lock
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your new password"
                minLength={8}
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

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={resetting}
          >
            {resetting ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Updating...
              </>
            ) : (
              <>
                Update password <ArrowRight size={17} />
              </>
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          Remembered it?{" "}
          <Link to="/login" className={cn("font-bold text-brand hover:underline")}>
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to YumGo"
      subtitle="Pick up where you left off — your favourites, orders and addresses are waiting."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="email"
              required
              className="h-12 w-full rounded-2xl border border-line bg-white pl-11 pr-4 text-sm outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[11px] font-bold text-ink" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[10px] font-semibold text-brand"
            >
              Forgot password?
            </button>
          </div>
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
              placeholder="Enter your password"
              autoComplete="current-password"
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

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-[11px] font-medium leading-relaxed text-rose-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight size={17} />
            </>
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        New to YumGo?{" "}
        <Link to="/signup" className={cn("font-bold text-brand hover:underline")}>
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
