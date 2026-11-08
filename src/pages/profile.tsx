import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Heart,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Sparkles,
  TicketPercent,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/providers";
import { useAuthStore } from "@/lib/store/auth";
import { useOrdersStore } from "@/lib/store/orders";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useAdminStore } from "@/lib/store/admin";
import { getOrdersForUser } from "@/lib/user-orders";
import { formatMMK } from "@/lib/utils";

function ProfileRow({
  icon,
  label,
  description,
  href,
  onClick,
  tone = "brand",
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  tone?: "brand" | "dark" | "green" | "rose";
  badge?: string;
}) {
  const toneClasses = {
    brand: "bg-brand-soft text-brand-dark",
    dark: "bg-ink text-white",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  }[tone];

  const content = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClasses}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-xs font-bold">
          {label}
          {badge && (
            <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-brand">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="mt-0.5 block truncate text-[10px] text-muted">
            {description}
          </span>
        )}
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted/60" />
    </>
  );

  const className =
    "flex w-full items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2.5 text-left transition hover:border-line hover:bg-cream/60";

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const mounted = useMounted();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const orders = useOrdersStore((state) => state.orders);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const promotions = useAdminStore((state) => state.promotions);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const myOrders = useMemo(
    () => getOrdersForUser(orders, user),
    [orders, user],
  );

  const delivered = myOrders.filter((order) => order.status === "delivered");
  const spent = delivered.reduce((sum, order) => sum + order.total, 0);
  const activePromos = promotions.filter((promo) => promo.isActive).length;

  const openEdit = () => {
    if (!user) {
      toast("Sign in first to edit your profile.");
      return;
    }
    setName(user.name);
    setPhone(user.phone);
    setEditOpen(true);
  };

  const saveProfile = async () => {
    const ok = await updateProfile({
      name: name.trim() || user?.name,
      phone: phone.trim(),
    });
    if (!ok) {
      toast.error("Could not update your profile. Please try again.");
      return;
    }
    setEditOpen(false);
    toast.success("Profile updated");
  };

  const handleLogout = async () => {
    await logout();
    toast("Signed out");
    navigate("/login");
  };

  if (!mounted) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-8 w-32 rounded-full" />
        <div className="mt-4 skeleton h-40 rounded-3xl" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="Profile"
        subtitle="Your YumGo account and preferences."
        showBack={false}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
          <div className="space-y-3">
            <section className="relative overflow-hidden rounded-[30px] bg-brand p-5 text-white shadow-soft">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[#7FE3AA]/20 blur-2xl" />

              <div className="relative flex items-start gap-3">
                {user ? (
                  <Avatar
                    name={user.name}
                    color={user.avatarColor}
                    size={62}
                    className="ring-4 ring-white/20"
                  />
                ) : (
                  <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white/15 ring-4 ring-white/20">
                    <UserRound size={28} />
                  </span>
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">
                    {user ? "YumGo member" : "Welcome to YumGo"}
                  </p>
                  <h1 className="mt-0.5 truncate text-xl font-extrabold tracking-tight">
                    {user?.name ?? "Guest"}
                  </h1>
                  <p className="mt-0.5 truncate text-[10px] text-white/70">
                    {user?.email ?? "Sign in to save your details"}
                  </p>
                  {user?.phone && (
                    <p className="mt-0.5 text-[10px] text-white/60">{user.phone}</p>
                  )}
                </div>
                {user && (
                  <button
                    type="button"
                    onClick={openEdit}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                    aria-label="Edit profile"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>

              {user ? (
                <div className="relative mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/10 p-2.5 text-center backdrop-blur">
                    <p className="text-lg font-extrabold">{myOrders.length}</p>
                    <p className="text-[9px] text-white/60">Orders</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-2.5 text-center backdrop-blur">
                    <p className="text-lg font-extrabold">{favoriteIds.length}</p>
                    <p className="text-[9px] text-white/60">Favorites</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-2.5 text-center backdrop-blur">
                    <p className="text-lg font-extrabold">
                      {formatMMK(spent).replace("Ks ", "")}
                    </p>
                    <p className="text-[9px] text-white/60">Ks spent</p>
                  </div>
                </div>
              ) : (
                <div className="relative mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-white text-brand hover:bg-cream"
                    onClick={() => navigate("/login?next=/profile")}
                  >
                    <LogIn size={14} /> Sign in
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => navigate("/signup")}
                  >
                    <UserRound size={14} /> Create account
                  </Button>
                </div>
              )}
            </section>

            {user ? (
              <section className="rounded-3xl border border-line bg-white p-3 shadow-card">
                <div className="flex items-center justify-between px-1 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Account overview
                  </p>
                  <Sparkles size={13} className="text-brand" />
                </div>
                <div className="mt-1 divide-y divide-line/70">
                  <div className="flex items-center justify-between px-1 py-2.5 text-[11px]">
                    <span className="text-muted">Total spent</span>
                    <span className="font-extrabold">{formatMMK(spent)}</span>
                  </div>
                  <div className="flex items-center justify-between px-1 py-2.5 text-[11px]">
                    <span className="text-muted">Active vouchers</span>
                    <span className="font-extrabold">{activePromos}</span>
                  </div>
                  <div className="flex items-center justify-between px-1 py-2.5 text-[11px]">
                    <span className="text-muted">Account status</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                      Active
                    </span>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-dashed border-brand/30 bg-brand-soft/30 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-brand">
                  <LogIn size={14} /> Sign in to unlock more
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  Save addresses, track orders and collect vouchers with your
                  YumGo account.
                </p>
                <Link
                  to="/login"
                  className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand"
                >
                  Go to sign in <ArrowRight size={12} />
                </Link>
              </section>
            )}
          </div>

          <div className="space-y-3">
            <section className="rounded-3xl border border-line bg-white p-2 shadow-card">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Account
              </p>
              <ProfileRow
                icon={<MapPin size={17} />}
                label="My Addresses"
                description="Home, work and saved delivery points"
                href="/profile/addresses"
              />
              <ProfileRow
                icon={<CreditCard size={17} />}
                label="Payment method"
                description="Cash on delivery on every order"
                onClick={() =>
                  toast("Pay the rider in cash when your order arrives.")
                }
              />
              <ProfileRow
                icon={<TicketPercent size={17} />}
                label="Vouchers & Promos"
                description={`${activePromos} active offers available`}
                href="/promos"
                badge={`${activePromos} active`}
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-2 shadow-card">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Activity
              </p>
              <ProfileRow
                icon={<ClipboardList size={17} />}
                label="Order History"
                description={`${myOrders.length} orders placed`}
                href="/orders"
              />
              <ProfileRow
                icon={<Heart size={17} />}
                label="Favorites"
                description={`${favoriteIds.length} saved restaurants`}
                href="/favorites"
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-2 shadow-card">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Support
              </p>
              <ProfileRow
                icon={<HelpCircle size={17} />}
                label="Help & Support"
                description="FAQs, contact and delivery help"
                href="/profile/help"
              />
              <ProfileRow
                icon={<Info size={17} />}
                label="About YumGo"
                description="How YumGo works"
                href="/profile/about"
              />
            </section>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-3xl border border-dashed border-brand/40 bg-brand-soft/40 p-4 transition hover:bg-brand-soft"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
                  <LayoutDashboard size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-brand">
                    Admin dashboard
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted">
                    Orders, restaurants, users, analytics and more
                  </span>
                </span>
                <ChevronRight size={17} className="text-brand" />
              </Link>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white py-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={15} /> Sign out
              </button>
            ) : (
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-xs font-bold text-white transition hover:bg-brand-dark"
              >
                <LogIn size={15} /> Sign in to YumGo
              </Link>
            )}

            <p className="pb-2 text-center text-[9px] text-muted/60">
              YumGo · v1.0 · Built with React, Vite & Supabase
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        description="Update the name and phone number shown on your account."
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={saveProfile}>
              Save changes
            </Button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <label className="block text-[10px] font-bold text-ink">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-line bg-cream/60 px-3.5 text-sm font-medium outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Phone number
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+95 9 ..."
              className="mt-1 h-11 w-full rounded-2xl border border-line bg-cream/60 px-3.5 text-sm font-medium outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>
          <p className="text-[9px] leading-relaxed text-muted">
            These details are saved to your YumGo account and used for order
            updates and delivery.
          </p>
        </div>
      </Modal>

    </div>
  );
}
