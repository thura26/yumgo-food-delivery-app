import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bike,
  ChevronDown,
  Clock3,
  CreditCard,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "support@yumgo.app";
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE || "";

const faqs = [
  {
    id: "tracking",
    category: "Orders",
    icon: <Bike size={17} />,
    question: "How do I track my order?",
    answer:
      "Open My Orders and tap any active order. You will see a live map with your rider's position, the status timeline and an estimated arrival time. The rider position and status update automatically as your order progresses.",
  },
  {
    id: "delivery-time",
    category: "Delivery",
    icon: <Clock3 size={17} />,
    question: "How long does delivery take?",
    answer:
      "Most YumGo orders arrive in 20–35 minutes depending on the restaurant and distance. Each restaurant card shows an estimated delivery window before you order.",
  },
  {
    id: "payments",
    category: "Payments",
    icon: <CreditCard size={17} />,
    question: "Which payment methods can I use?",
    answer:
      "YumGo accepts cash on delivery. Please prepare the exact total shown at checkout and pay the rider when your order arrives. No card details are collected or stored.",
  },
  {
    id: "promo",
    category: "Promos",
    icon: <TicketPercent size={17} />,
    question: "How do I apply a promo code?",
    answer:
      "Add items to your cart, open the Promo code section and enter the code, or copy one from the Promos page. Codes have a minimum order value and a validity date.",
  },
  {
    id: "reorder",
    category: "Orders",
    icon: <RotateCcw size={17} />,
    question: "Can I reorder a previous meal?",
    answer:
      "Yes. Delivered orders show a Reorder action on the order card. You can also open a delivered order's receipt page and tap Order again.",
  },
  {
    id: "address",
    category: "Delivery",
    icon: <MapPin size={17} />,
    question: "How do I change my delivery address?",
    answer:
      "Go to Profile → My Addresses to add, edit or delete saved addresses. During checkout you can also open the address picker and drop a pin on the map.",
  },
  {
    id: "cancel",
    category: "Orders",
    icon: <ShoppingBag size={17} />,
    question: "Can I cancel an order?",
    answer:
      "Contact support as soon as possible. We can cancel an order before the restaurant starts preparing it. Once preparation has started, please contact us and we will help with the next steps.",
  },
  {
    id: "privacy",
    category: "Account",
    icon: <ShieldCheck size={17} />,
    question: "Is my data stored safely?",
    answer:
      "Your account, orders and addresses are stored in Supabase and protected by row-level security. Only you and authorised YumGo staff can access your data.",
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>("tracking");
  const [query, setQuery] = useState("");

  const filtered = faqs.filter((faq) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q) ||
      faq.category.toLowerCase().includes(q)
    );
  });

  const supportOptions = [
    {
      icon: <Mail size={18} />,
      title: "Email us",
      text: SUPPORT_EMAIL,
      action: () => {
        window.location.href = `mailto:${SUPPORT_EMAIL}`;
      },
    },
    ...(SUPPORT_PHONE
      ? [
          {
            icon: <Phone size={18} />,
            title: "Call us",
            text: SUPPORT_PHONE,
            action: () => {
              window.location.href = `tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`;
            },
          },
        ]
      : []),
    {
      icon: <ShoppingBag size={18} />,
      title: "Order help",
      text: "Track or review an order",
      action: () => navigate("/orders"),
    },
  ];

  return (
    <div className="pb-6">
      <PageHeader
        title="Help & support"
        subtitle="Answers, tips and ways to reach the team."
      />

      <div className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] bg-ink p-5 text-white shadow-soft sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/80">
              <HelpCircle size={11} /> Support centre
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
              How can we help?
            </h1>
            <p className="mt-1.5 max-w-md text-[11px] leading-relaxed text-white/60 sm:text-xs">
              Search common questions or contact the YumGo support team. We
              usually reply within a few minutes during service hours.
            </p>
            <div className="mt-4 flex h-11 items-center gap-2 rounded-2xl bg-white/95 px-4 text-ink shadow-lg">
              <Search size={17} className="shrink-0 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search help topics..."
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
              />
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {supportOptions.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className="flex items-start gap-3 rounded-3xl border border-line bg-white p-4 text-left shadow-card transition hover:border-brand/30 hover:shadow-soft"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-extrabold">{item.title}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted">
                  {item.text}
                </span>
              </span>
            </button>
          ))}
        </div>

        <section className="mt-5">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                Frequently asked
              </p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight">
                Common questions
              </h2>
            </div>
            <span className="text-[10px] text-muted">
              {filtered.length} topic{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-2">
            {filtered.map((faq) => {
              const open = openId === faq.id;
              return (
                <article
                  key={faq.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition",
                    open
                      ? "border-brand/30 shadow-card"
                      : "border-line hover:border-brand/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : faq.id)}
                    className="flex w-full items-center gap-3 p-3.5 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                        open
                          ? "bg-brand text-white"
                          : "bg-brand-soft text-brand-dark",
                      )}
                    >
                      {faq.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                        {faq.category}
                      </span>
                      <span className="mt-0.5 block text-xs font-bold">
                        {faq.question}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "shrink-0 text-muted transition-transform",
                        open && "rotate-180 text-brand",
                      )}
                    />
                  </button>
                  {open && (
                    <div className="px-3.5 pb-4 pl-[60px] text-[11px] leading-relaxed text-muted">
                      {faq.answer}
                    </div>
                  )}
                </article>
              );
            })}
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center">
                <p className="text-xs font-bold">No matching topics</p>
                <p className="mt-1 text-[10px] text-muted">
                  Try a different keyword or contact us directly.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-dashed border-brand/30 bg-brand-soft/30 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold">Still stuck?</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                Send us an email and we will get back to you.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = `mailto:${SUPPORT_EMAIL}`;
                }}
              >
                <Mail size={14} /> Email us
              </Button>
              <Button size="sm" onClick={() => navigate("/orders")}>
                <MessageCircle size={14} /> View my orders
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] font-semibold text-muted">
          <Link to="/profile" className="hover:text-brand">
            Profile
          </Link>
          <span className="h-0.5 w-0.5 rounded-full bg-muted/50" />
          <Link to="/orders" className="hover:text-brand">
            My orders
          </Link>
          <span className="h-0.5 w-0.5 rounded-full bg-muted/50" />
          <Link to="/promos" className="hover:text-brand">
            Promos
          </Link>
        </div>
      </div>
    </div>
  );
}
