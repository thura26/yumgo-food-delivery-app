# YumGo — Food Delivery, Closer to You

YumGo is a production-ready food delivery web app for Yangon, built with **Vite 8**, **React 19**, **React Router 7**, **TypeScript**, **Tailwind CSS v4**, **Zustand**, **Leaflet** and **Supabase**.

It includes a complete customer app, cash-on-delivery checkout, live delivery tracking, and a role-protected admin dashboard for orders, restaurants, users, analytics, promotions and reviews.

---

## Production features

### Customer app

- **Onboarding** with a three-slide intro and a location step after signup.
- **Accounts** powered by Supabase Auth: sign up, sign in, email confirmation and password reset.
- **Home** with categories, featured restaurants, popular dishes and active promotions from Supabase.
- **Restaurant discovery** with search, category filters, sorting and responsive cards.
- **Restaurant detail** with the live menu, reviews and an about tab.
- **Cart** with quantity controls, promo codes, minimum-order checks and MMK pricing.
- **Checkout** with saved addresses, a map picker, delivery notes and **Cash on Delivery only**.
- **Live tracking** on Leaflet + OpenStreetMap with a moving rider pin, status timeline and automatic progression from confirmed → preparing → on the way → delivered.
- **Order receipt** with a downloadable text receipt, order summary and one-tap reorder.
- **Orders, favorites, promos, profile, addresses, help centre and about** pages.
- Sign-in is required before checkout and before writing a review. There is no guest checkout.

### Admin dashboard

- **Overview** with revenue KPIs, 7-day chart, status donut, recent orders and live deliveries.
- **Orders** with search, status filters, CSV export, detail modal, advance status and cancel.
- **Restaurants & menus** with open/closed toggles, detail editing, menu availability and price editing.
- **Users** with search, role filters, block/unblock and role changes. Users create their own accounts; admins manage roles and status only.
- **Analytics** with 7/14/30-day ranges, revenue and volume charts, status mix, peak hours and top customers.
- **Promotions** with create/edit/delete, active toggles, usage limits and redemption progress.
- **Reviews** with pending/approved filters and approve/hide/delete moderation.

Access is restricted by `public.profiles.role` and enforced with row-level security. The first admin is promoted with `supabase/promote-admin.sql`.

---

## Tech stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Vite 8, React 19, React Router 7, TypeScript        |
| Styling    | Tailwind CSS v4, custom shadcn-style components     |
| State      | Zustand (cart and favorites persisted locally)      |
| Charts     | Recharts                                            |
| Maps       | Leaflet + React Leaflet + OpenStreetMap/Nominatim   |
| Motion     | Framer Motion                                       |
| Toasts     | Sonner                                              |
| Backend    | Supabase (Auth + Postgres + RLS + Realtime)         |
| Deployment | Vercel static build + `/api/geocode` edge function  |

### Design tokens

- Brand green `#00B14F`
- Cream `#FFF8F3`
- Ink `#171717`
- Warning amber `#F4B740`
- Success green `#2F9E63`
- Typeface: **Plus Jakarta Sans**
- Currency: **MMK**, formatted as `Ks 9,500`

---

## Getting started

```bash
npm install
cp .env.example .env.local   # add your Supabase values
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
VITE_SUPPORT_EMAIL=support@your-domain.com
VITE_SUPPORT_PHONE=+95 9 000 000 000
```

All values are safe for the browser. Never expose a service-role key in a `VITE_*` variable: Vite inlines every `VITE_*` value into the client bundle.

### Scripts

```bash
npm run dev       # Vite dev server
npm run build     # type-check and build the SPA into dist/
npm run preview   # serve the production build locally
npm run start     # alias for npm run preview
npm run lint      # ESLint
```

---

## Supabase setup

1. Create a project at <https://supabase.com>.
2. In **SQL Editor**, run:
   - `supabase/migrations/20261104000000_init.sql`
   - `supabase/migrations/20261106000000_production_hardening.sql`
   - `supabase/migrations/20261106000001_security_followups.sql`
   - `supabase/seed.sql` (restaurants and menus only)
3. If the project already contains demo data, run `supabase/cleanup-demo-data.sql`.
4. Create your own account from `/signup`, confirm the email, then run `supabase/promote-admin.sql` with your email address.
5. Add the project URL and publishable key to `.env.local`.
6. Restart `npm run dev`.

### What the migrations create

- Enums for roles, account status, order status, payment method/status and promotion type.
- `profiles`, `addresses`, `restaurants`, `menu_categories`, `menu_items`, `orders`, `reviews`, `promotions`, `favorites` and `payment_methods`.
- A signup trigger that creates a customer profile automatically.
- Row-level security: public catalog reads, owner-only addresses/orders/favorites, and admin-only catalog and order management.
- `advance_order_status()` — a security-definer RPC that lets a customer advance **only their own** auto-advance order, one step at a time.
- A COD-only constraint on orders and a policy that requires every order to belong to the signed-in user.
- Realtime publication for orders, reviews, promotions, profiles and restaurants.
- Public `menu-images` and `avatars` storage buckets with admin-only write policies.

### Email confirmation and redirect URLs

Supabase enables **Confirm email** by default. For production:

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to `https://yumgo.vercel.app`.
3. Add `https://yumgo.vercel.app/**` to **Redirect URLs**.
4. Keep email confirmation enabled and customise the confirmation template if needed.

Password reset emails redirect to `/login?reset=1`, where the customer chooses a new password.

---

## Deploy to Vercel

The repository includes `vercel.json`, which rewrites every non-API path to `index.html` so client-side routes survive a refresh.

1. Push the repository to GitHub/GitLab and import it in Vercel (or run `npx vercel`).
2. Vercel detects Vite and uses `npm run build` with `dist` as the output directory.
3. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPPORT_EMAIL` and `VITE_SUPPORT_PHONE` in **Project Settings → Environment Variables**.
4. Redeploy after changing them — `VITE_*` values are inlined at build time.
5. Add the Vercel domain to Supabase **Authentication → URL Configuration** (see above).

`api/geocode.ts` is deployed as a Vercel edge function automatically, so `/api/geocode` keeps working in production. Location permission works because Vercel serves the app over HTTPS.

---

## Reverse geocoding proxy

The location picker calls `/api/geocode?lat=…&lng=…`. The request is handled by `server/geocode.ts`, a shared Web-standard handler that:

- validates the coordinates,
- calls Nominatim with a proper `User-Agent`,
- caches successful responses for 24 hours,
- returns a compact `{ label, city, country }` payload.

The same handler is mounted in two places:

| Environment      | Entry point                 |
| ---------------- | --------------------------- |
| Vite dev/preview | `vite.config.ts` middleware |
| Vercel           | `api/geocode.ts`            |

---

## Project structure

```text
src/
├── pages/                      # Route components (customer, auth, admin)
│   ├── onboarding.tsx
│   ├── login.tsx / signup.tsx
│   ├── home.tsx
│   ├── restaurants.tsx
│   ├── restaurant.tsx
│   ├── cart.tsx / checkout.tsx
│   ├── order-success.tsx / order-tracking.tsx / orders.tsx
│   ├── favorites.tsx / promos.tsx
│   ├── profile*.tsx
│   └── admin*.tsx
├── components/
│   ├── admin/                  # Admin shell, charts, UI primitives
│   ├── maps/                   # Lazy-loaded Leaflet tracking map and address picker
│   └── ui/                     # Buttons, badges, modals, tabs, image wrapper
├── lib/
│   ├── db/                     # Supabase data access (orders, reviews, promotions, users)
│   ├── store/                  # Zustand stores (auth, cart, orders, addresses, admin)
│   ├── analytics.ts            # Revenue/status/payment/peak-hour helpers
│   ├── supabase.ts             # Browser Supabase client
│   ├── use-catalog.ts          # Loads restaurants and menus from Supabase
│   └── utils.ts                # Formatting, pricing, order codes, status meta
├── App.tsx                     # Route tree, page titles, scroll restoration
└── main.tsx                    # BrowserRouter + providers
server/geocode.ts               # Shared reverse-geocoding handler
api/geocode.ts                  # Vercel edge entry
supabase/
├── migrations/20261104000000_init.sql
├── migrations/20261106000000_production_hardening.sql
├── migrations/20261106000001_security_followups.sql
├── seed.sql                    # Restaurants and menus only
├── cleanup-demo-data.sql       # One-time demo data removal
└── promote-admin.sql           # Promote the first administrator
```

### Local storage keys

Only the cart and favorites are stored in the browser.

| Key                  | Contents                              |
| -------------------- | ------------------------------------- |
| `yumgo-cart-v1`      | Cart restaurant, lines and promo code |
| `yumgo-favorites-v1` | Saved restaurant ids                  |

Orders, addresses, profiles, reviews, promotions and admin data are stored in Supabase.

---

## Operational notes

- Payment is **Cash on Delivery only**. The order is marked paid when it reaches `delivered`.
- Delivery progression is simulated by the client for now: confirmed → preparing → on the way → delivered. The rider pin moves along the route while the order is on the way.
- The geocode proxy caches responses for 24 hours, but public Nominatim is still rate-limited.
- Admin access is controlled by `profiles.role = 'admin'`. To revoke access, set the role back to `customer` in the admin Users page or in SQL.
- To block an account, set `profiles.status = 'blocked'` from the admin Users page. Blocked accounts are signed out on their next sign-in attempt.

---

## License

The YumGo brand, copy and catalog are part of this project. Food photography is bundled locally for the application.
