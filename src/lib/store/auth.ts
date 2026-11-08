import { create } from "zustand";
import type { AuthUser } from "@/lib/types";
import { colorFromString } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import { updateProfileRemote } from "@/lib/db/users";

type AuthResult = {
  ok: boolean;
  message?: string;
  needsConfirmation?: boolean;
  user?: AuthUser;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  /** True once the persisted Supabase session has been checked on this load. */
  authHydrated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<AuthUser>) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  hydrateFromSupabase: () => Promise<void>;
};

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseClient>>;

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "admin";
  status: "active" | "blocked";
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

function mapSupabaseUser(
  user: SupabaseAuthUser,
  profile?: ProfileRow | null,
): AuthUser {
  const email = profile?.email ?? user.email ?? "";
  const name =
    profile?.name ??
    (user.user_metadata?.full_name as string | undefined) ??
    email.split("@")[0] ??
    "YumGo User";
  const isAdmin =
    profile?.role === "admin" || user.app_metadata?.role === "admin";

  return {
    id: user.id,
    name,
    email,
    phone: profile?.phone ?? (user.user_metadata?.phone as string | undefined) ?? "",
    role: isAdmin ? "admin" : "customer",
    avatarColor: colorFromString(email || user.id),
  };
}

async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  loading: false,
  authHydrated: false,

  login: async (email, password) => {
    const normalized = email.trim().toLowerCase();
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        ok: false,
        message: "YumGo is not configured. Please contact support.",
      };
    }

    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (error || !data.user) {
      set({ loading: false });
      return {
        ok: false,
        message: error?.message ?? "We could not sign you in.",
      };
    }

    const profile = await loadProfile(supabase, data.user.id);
    if (profile?.status === "blocked") {
      await supabase.auth.signOut();
      set({ loading: false });
      return {
        ok: false,
        message: "This account has been blocked. Please contact support.",
      };
    }

    const mapped = mapSupabaseUser(data.user, profile);
    set({ user: mapped, loading: false, authHydrated: true });
    return { ok: true, user: mapped };
  },

  signUp: async (name, email, password) => {
    const normalized = email.trim().toLowerCase();
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        ok: false,
        message: "YumGo is not configured. Please contact support.",
      };
    }

    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/welcome/location`,
      },
    });
    set({ loading: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    if (data.session && data.user) {
      const profile = await loadProfile(supabase, data.user.id);
      const mapped = mapSupabaseUser(data.user, profile);
      set({ user: mapped, authHydrated: true });
      return { ok: true, user: mapped };
    }

    return {
      ok: true,
      needsConfirmation: true,
      message: "Your account was created. Check your email to confirm it.",
    };
  },

  logout: async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, authHydrated: true });
  },

  updateProfile: async (patch) => {
    const current = get().user;
    if (!current) return false;

    const ok = await updateProfileRemote(current.id, {
      name: patch.name,
      phone: patch.phone,
    });
    if (!ok) return false;

    set({ user: { ...current, ...patch } });
    return true;
  },

  requestPasswordReset: async (email) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { ok: false, message: "Enter your email address first." };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        ok: false,
        message: "YumGo is not configured. Please contact support.",
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/login?reset=1`,
    });

    return error
      ? { ok: false, message: error.message }
      : { ok: true, message: "Password reset email sent." };
  },

  updatePassword: async (password) => {
    if (password.length < 8) {
      return {
        ok: false,
        message: "Password must be at least 8 characters.",
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        ok: false,
        message: "YumGo is not configured. Please contact support.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password });
    return error
      ? { ok: false, message: error.message }
      : { ok: true, message: "Password updated." };
  },

  hydrateFromSupabase: async () => {
    if (get().user) {
      set({ authHydrated: true });
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      set({ authHydrated: true });
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return;

      const profile = await loadProfile(supabase, data.session.user.id);
      if (profile?.status === "blocked") {
        await supabase.auth.signOut();
        return;
      }

      set({ user: mapSupabaseUser(data.session.user, profile) });
    } finally {
      set({ authHydrated: true });
    }
  },
}));
