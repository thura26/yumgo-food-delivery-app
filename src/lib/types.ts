export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "preparing"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type UserRole = "customer" | "admin";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isPopular?: boolean;
  isAvailable?: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  description: string;
  cover: string;
  logoColor: string;
  rating: number;
  ratingCount: number;
  deliveryFee: number;
  minOrder: number;
  etaMin: number;
  etaMax: number;
  distanceKm: number;
  isOpen: boolean;
  isFeatured: boolean;
  township: string;
  address: string;
  hours: string;
  lat: number;
  lng: number;
  tags: string[];
  categories: MenuCategory[];
};

export type CartLine = {
  itemId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

export type Driver = {
  name: string;
  phone: string;
  plate: string;
  rating: number;
  avatarColor: string;
};

export type OrderEvent = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type Order = {
  id: string;
  code: string;
  userId?: string;
  userEmail: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  restaurantTownship: string;
  items: CartLine[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  address: string;
  lat: number;
  lng: number;
  notes: string;
  placedAt: string;
  driver: Driver;
  events: OrderEvent[];
  autoAdvance?: boolean;
};

export type Review = {
  id: string;
  restaurantId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  isApproved: boolean;
};

export type Promotion = {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  endsAt: string;
  isActive: boolean;
  usageCount: number;
  usageLimit: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  orders: number;
  joinedAt: string;
  status: "active" | "blocked";
  avatarColor: string;
};

export type Address = {
  id: string;
  label: string;
  line: string;
  township: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  isDefault?: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarColor: string;
};

export type HomeCategory = {
  id: string;
  name: string;
  tag: string;
};
