import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Crown,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui";
import { Avatar } from "@/components/avatar";
import { Modal } from "@/components/ui/modal";
import { PillTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/providers";
import { useAdminStore } from "@/lib/store/admin";
import { useOrdersStore } from "@/lib/store/orders";
import type { AdminUser } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

type RoleFilter = "all" | "customer" | "admin" | "blocked";

export default function AdminUsersPage() {
  const mounted = useMounted();
  const users = useAdminStore((state) => state.users);
  const orders = useOrdersStore((state) => state.orders);
  const updateUser = useAdminStore((state) => state.updateUser);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const counts = useMemo(
    () => ({
      all: users.length,
      customer: users.filter((user) => user.role === "customer").length,
      admin: users.filter((user) => user.role === "admin").length,
      blocked: users.filter((user) => user.status === "blocked").length,
    }),
    [users],
  );

  const orderCounts = useMemo(() => {
    const countsByEmail = new Map<string, number>();
    for (const order of orders) {
      const email = order.userEmail.trim().toLowerCase();
      countsByEmail.set(email, (countsByEmail.get(email) ?? 0) + 1);
    }
    return countsByEmail;
  }, [orders]);

  const orderCountFor = (user: AdminUser) =>
    orderCounts.get(user.email.trim().toLowerCase()) ?? 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.phone.includes(q);
      const matchesRole =
        role === "all"
          ? true
          : role === "blocked"
            ? user.status === "blocked"
            : user.role === role;
      return matchesQuery && matchesRole;
    });
  }, [users, query, role]);

  const toggleStatus = (user: AdminUser) => {
    const next = user.status === "blocked" ? "active" : "blocked";
    updateUser(user.id, { status: next });
    toast.success(
      `${user.name} ${next === "blocked" ? "blocked" : "reactivated"}`,
    );
    setSelected((current) => (current ? { ...current, status: next } : current));
  };

  const toggleRole = (user: AdminUser) => {
    const next = user.role === "admin" ? "customer" : "admin";
    updateUser(user.id, { role: next });
    toast.success(`${user.name} is now ${next === "admin" ? "an admin" : "a customer"}`);
    setSelected((current) => (current ? { ...current, role: next } : current));
  };

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-24 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total users",
            value: counts.all,
            icon: <Users size={16} />,
            tone: "bg-brand-soft text-brand-dark",
          },
          {
            label: "Customers",
            value: counts.customer,
            icon: <UserRound size={16} />,
            tone: "bg-blue-50 text-blue-600",
          },
          {
            label: "Admins",
            value: counts.admin,
            icon: <ShieldCheck size={16} />,
            tone: "bg-violet-50 text-violet-600",
          },
          {
            label: "Blocked",
            value: counts.blocked,
            icon: <Ban size={16} />,
            tone: "bg-rose-50 text-rose-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-white p-3.5 shadow-card"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                stat.tone,
              )}
            >
              {stat.icon}
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">{stat.value}</p>
            <p className="text-[9px] font-semibold text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <AdminCard
        title="User directory"
        subtitle={`${filtered.length} accounts in this view`}
        bodyClassName="p-0 sm:p-0"
      >
        <div className="space-y-3 border-b border-line/70 px-4 py-3 sm:px-5">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-cream/60 px-3">
            <Search size={15} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email or phone..."
              className="h-full w-full bg-transparent text-[11px] outline-none placeholder:text-muted/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <PillTabs
            size="sm"
            tabs={[
              { value: "all", label: "All", count: counts.all },
              { value: "customer", label: "Customers", count: counts.customer },
              { value: "admin", label: "Admins", count: counts.admin },
              { value: "blocked", label: "Blocked", count: counts.blocked },
            ]}
            value={role}
            onChange={setRole}
          />
        </div>

        <div className="divide-y divide-line/70 lg:hidden">
          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelected(user)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cream/50"
            >
              <Avatar name={user.name} color={user.avatarColor} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[11px] font-bold">{user.name}</p>
                  {user.role === "admin" && (
                    <Crown size={11} className="shrink-0 text-brand" />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[9px] text-muted">{user.email}</p>
                <p className="mt-0.5 text-[9px] text-muted">
                  {orderCountFor(user)} orders · joined {formatDate(user.joinedAt)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                  user.status === "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600",
                )}
              >
                {user.status}
              </span>
            </button>
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-line/60 text-[11px] transition last:border-0 hover:bg-cream/40"
                >
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(user)}
                      className="flex items-center gap-2.5 text-left"
                    >
                      <Avatar name={user.name} color={user.avatarColor} size={32} />
                      <span>
                        <span className="flex items-center gap-1 font-bold">
                          {user.name}
                          {user.role === "admin" && (
                            <Crown size={11} className="text-brand" />
                          )}
                        </span>
                        <span className="mt-0.5 block text-[9px] text-muted">
                          {user.email}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted">{user.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                        user.role === "admin"
                          ? "bg-ink text-white"
                          : "bg-cream text-muted",
                      )}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{orderCountFor(user)}</td>
                  <td className="px-4 py-3 text-[10px] text-muted">
                    {formatDate(user.joinedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                        user.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600",
                      )}
                    >
                      {user.status === "active" ? (
                        <CheckCircle2 size={9} />
                      ) : (
                        <Ban size={9} />
                      )}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(user)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[9px] font-bold transition",
                        user.status === "blocked"
                          ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          : "border-line text-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
                      )}
                    >
                      {user.status === "blocked" ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Search size={22} className="mx-auto text-muted/50" />
              <p className="mt-2 text-xs font-bold">No users match</p>
              <p className="mt-1 text-[10px] text-muted">
                Try a different search or role filter.
              </p>
            </div>
          )}
        </div>
      </AdminCard>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "User"}
        description={selected ? `Joined ${formatDate(selected.joinedAt)}` : undefined}
        className="sm:max-w-md"
      >
        {selected && (
          <div className="space-y-4 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Avatar name={selected.name} color={selected.avatarColor} size={54} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-extrabold">{selected.name}</p>
                  {selected.role === "admin" && <Crown size={13} className="text-brand" />}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-muted">
                  {selected.role} · {selected.status}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl bg-cream p-3.5 text-[11px]">
              <p className="flex items-center gap-2 text-muted">
                <Mail size={12} className="text-brand" /> {selected.email}
              </p>
              <p className="flex items-center gap-2 text-muted">
                <Phone size={12} className="text-brand" /> {selected.phone}
              </p>
              <p className="flex items-center gap-2 text-muted">
                <UserRound size={12} className="text-brand" />{" "}
                {orderCountFor(selected)} orders placed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleRole(selected)}
              >
                <Crown size={13} />
                {selected.role === "admin" ? "Make customer" : "Make admin"}
              </Button>
              <Button
                size="sm"
                variant={selected.status === "blocked" ? "primary" : "outline"}
                className={
                  selected.status === "blocked" ? "" : "text-rose-600"
                }
                onClick={() => toggleStatus(selected)}
              >
                {selected.status === "blocked" ? (
                  <>
                    <CheckCircle2 size={13} /> Unblock
                  </>
                ) : (
                  <>
                    <Ban size={13} /> Block user
                  </>
                )}
              </Button>
            </div>
            <p className="text-[9px] leading-relaxed text-muted">
              Role and status changes are written to Supabase and enforced with
              row-level security.
            </p>
          </div>
        )}
      </Modal>

      <p className="text-center text-[9px] text-muted/60">
        {users.length} accounts · synced from Supabase
      </p>
    </div>
  );
}
