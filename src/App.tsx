import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { CustomerShell } from "@/components/customer-shell";
import { AdminShell } from "@/components/admin/admin-shell";
import { useCatalog } from "@/lib/use-catalog";
import { Onboarding } from "@/pages/onboarding";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import WelcomeLocationPage from "@/pages/welcome-location";
import { HomeClient } from "@/pages/home";
import { RestaurantsClient } from "@/pages/restaurants";
import RestaurantPage from "@/pages/restaurant";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import FavoritesPage from "@/pages/favorites";
import OrdersPage from "@/pages/orders";
import TrackingPage from "@/pages/order-tracking";
import SuccessPage from "@/pages/order-success";
import PromosPage from "@/pages/promos";
import ProfilePage from "@/pages/profile";
import AboutPage from "@/pages/profile-about";
import AddressesPage from "@/pages/profile-addresses";
import HelpPage from "@/pages/profile-help";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminOrdersPage from "@/pages/admin/orders";
import AdminRestaurantsPage from "@/pages/admin/restaurants";
import AdminUsersPage from "@/pages/admin/users";
import AdminAnalyticsPage from "@/pages/admin/analytics";
import AdminPromotionsPage from "@/pages/admin/promotions";
import AdminReviewsPage from "@/pages/admin/reviews";
import NotFoundPage from "@/pages/not-found";

const PAGE_TITLES: Record<string, string> = {
  "/login": "Sign in",
  "/signup": "Create account",
  "/welcome/location": "Set your location",
  "/home": "Home",
  "/restaurants": "Restaurants",
  "/cart": "Cart",
  "/checkout": "Checkout",
  "/favorites": "Favorites",
  "/orders": "My orders",
  "/promos": "Promotions",
  "/profile": "Profile",
  "/profile/about": "About YumGo",
  "/profile/addresses": "Addresses",
  "/profile/help": "Help centre",
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/restaurants": "Restaurants & menus",
  "/admin/users": "Users",
  "/admin/analytics": "Analytics",
  "/admin/promotions": "Promotions",
  "/admin/reviews": "Reviews",
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function DocumentTitle() {
  const { pathname } = useLocation();
  const catalog = useCatalog();

  useEffect(() => {
    let page: string | undefined = PAGE_TITLES[pathname];

    if (!page && pathname.startsWith("/restaurants/")) {
      const slug = pathname.split("/")[2] ?? "";
      page = catalog.find((restaurant) => restaurant.slug === slug)?.name;
    }

    if (!page && pathname.startsWith("/orders/")) {
      page = pathname.endsWith("/tracking")
        ? "Track order"
        : pathname.endsWith("/success")
          ? "Order confirmed"
          : undefined;
    }

    document.title = page
      ? `${page} · YumGo`
      : "YumGo — Good food, closer to you";
  }, [pathname, catalog]);

  return null;
}

function CustomerLayout() {
  return (
    <CustomerShell>
      <Outlet />
    </CustomerShell>
  );
}

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <DocumentTitle />
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/welcome/location" element={<WelcomeLocationPage />} />

        <Route element={<CustomerLayout />}>
          <Route path="/home" element={<HomeClient />} />
          <Route path="/restaurants" element={<RestaurantsClient />} />
          <Route path="/restaurants/:slug" element={<RestaurantPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id/tracking" element={<TrackingPage />} />
          <Route path="/orders/:id/success" element={<SuccessPage />} />
          <Route path="/promos" element={<PromosPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/about" element={<AboutPage />} />
          <Route path="/profile/addresses" element={<AddressesPage />} />
          <Route path="/profile/help" element={<HelpPage />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route
            path="/admin/restaurants"
            element={<AdminRestaurantsPage />}
          />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
