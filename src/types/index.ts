export type UserRole = 'admin' | 'waiter' | 'kitchen' | 'cashier' | 'customer';

export type WaiterShiftStatus = 'active' | 'break' | 'vacation' | 'inactive';

export interface Waiter {
  id: string;               // Tizim identifikatori
  badge_id: string;         // Xodim ID kodi (masalan: OF-01)
  full_name: string;        // F.I.SH (Familiya Ism Sharif)
  phone: string;            // Telefon raqami (+998 __ ___-__-__)
  jshir: string;            // JSHIR: 14 raqamli JShShIR
  passport_number?: string; // Pasport seriya va raqami
  role_title?: string;      // Lavozimi (Bosh ofitsiant, Katta ofitsiant, Ofitsiant, Yordamchi)
  status: WaiterShiftStatus;// Smena holati
  assigned_tables: number[];// Biriktirilgan stollar raqamlari
  rating?: number;          // Reyting (1-5)
  orders_serviced?: number; // Xizmat ko'rsatilgan cheklar soni
  hired_at?: string;        // Ishga olingan sana
  avatar_url?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  image_url?: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number; // in UZS (so'm)
  image_url: string;
  is_available: boolean;
  preparation_time_minutes: number;
  calories?: number;
  weight_or_portion?: string;
  tags?: string[];
  tier?: 'oddiy' | 'biznes' | 'vip'; // Turi: Oddiy, Biznes, VIP
  created_at: string;
  updated_at: string;
}

export type TableZone = 'oddiy' | 'biznes' | 'vip' | 'standard' | 'business' | 'main' | 'terrace';

export type TableStatus = 'free' | 'busy' | 'service' | 'bill';

export interface RestaurantTable {
  id: string;
  table_number: number;
  label?: string; // e.g. "Stol №12" or "VIP Samarqand"
  zone: TableZone;
  tier?: 'oddiy' | 'biznes' | 'vip'; // Turi: Oddiy, Biznes, VIP
  seats: number;
  qr_token: string;
  is_active: boolean;
  assigned_waiter_name?: string;
  created_at: string;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id?: string;
  menu_item_id: string;
  item_name: string;
  unit_price: number; // price snapshot at order time
  quantity: number;
  item_note?: string;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string; // e.g. "#DF-1082"
  table_id: string;
  table_number: number;
  status: OrderStatus;
  total_amount: number;
  customer_note?: string;
  waiter_called?: boolean;
  waiter_call_note?: string;
  bill_requested?: boolean;
  waiter_name?: string;
  rating?: number; // 1 to 5
  customer_review?: {
    overall_rating: number; // 1 to 5
    food_rating?: number;
    speed_rating?: number;
    waiter_rating?: number;
    atmosphere_rating?: number;
    tags?: string[];
    comment?: string;
    customer_name?: string;
    tip_amount?: number;
    submitted_at: string;
  };
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CustomerFeedback {
  id: string;
  order_id: string;
  order_number: string;
  table_number: number;
  waiter_name?: string;
  overall_rating: number; // 1 to 5
  food_rating?: number;
  speed_rating?: number;
  waiter_rating?: number;
  atmosphere_rating?: number;
  tags: string[];
  comment: string;
  customer_name?: string;
  customer_phone?: string;
  tip_amount?: number;
  created_at: string;
}

export interface DishReview {
  id: string;
  menu_item_id: string;
  dish_name: string;
  table_number: number;
  rating: number; // 1 to 5
  comment: string;
  customer_name?: string;
  created_at: string;
}

export interface RestaurantRatingSummary {
  averageRating: number;
  totalReviews: number;
  dishReviewsCount: number;
  orderReviewsCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  item_note?: string;
}

export interface ServiceCall {
  id: string;
  table_id: string;
  table_number: number;
  type: 'waiter' | 'bill' | 'water';
  note?: string;
  created_at: string;
  last_called_at?: string;
  call_count?: number;
  escalated_to_admin?: boolean;
  assigned_waiter_name?: string;
  status: 'pending' | 'resolved';
}

export interface SalesReportEntry {
  date: string;
  revenue: number;
  orders_count: number;
  avg_check: number;
}
