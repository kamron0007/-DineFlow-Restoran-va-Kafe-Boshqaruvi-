import {
  Category,
  MenuItem,
  RestaurantTable,
  Order,
  OrderItem,
  OrderStatus,
  CartItem,
  ServiceCall,
  Waiter,
  WaiterShiftStatus,
  CustomerFeedback,
  DishReview,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_DISH_REVIEWS,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_WAITERS,
} from './seedData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateOrderNumber } from '../utils/formatters';
import { soundService } from './sound';

const STORAGE_KEYS = {
  CATEGORIES: 'dineflow_categories_v1',
  MENU_ITEMS: 'dineflow_menu_items_v6',
  TABLES: 'dineflow_tables_v3',
  ORDERS: 'dineflow_orders_v3',
  SERVICE_CALLS: 'dineflow_service_calls_v1',
  WAITERS: 'dineflow_waiters_v1',
  FEEDBACKS: 'dineflow_customer_feedbacks_v1',
  DISH_REVIEWS: 'dineflow_dish_reviews_v1',
};

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('dineflow_realtime_channel');
  }
} catch {
  // Ignore fallback
}

export interface RealtimeEventData {
  type: 'orders' | 'tables' | 'menu' | 'service' | 'waiters' | 'reviews';
  action?: 'order_status_changed' | 'order_created' | 'order_cancelled' | 'service_call_created' | 'service_call_resolved' | 'table_settled_and_freed' | 'dish_review_added';
  orderId?: string;
  orderNumber?: string;
  tableNumber?: number;
  oldStatus?: OrderStatus;
  newStatus?: OrderStatus;
  callId?: string;
  serviceType?: 'waiter' | 'bill' | 'water';
  serviceNote?: string;
  callCount?: number;
  escalatedToAdmin?: boolean;
  assignedWaiterName?: string;
  totalAmount?: number;
  itemsCount?: number;
}

export const emitRealtimeEvent = (type: 'orders' | 'tables' | 'menu' | 'service' | 'waiters' | 'reviews', data?: Partial<RealtimeEventData>) => {
  const detail: RealtimeEventData = { type, ...data };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dineflow:sync', { detail }));
  }
  if (broadcastChannel) {
    broadcastChannel.postMessage(detail);
  }
};

class DataService {
  private isDemo: boolean;
  private realtimeInitialized = false;
  private isSyncingOrders = false;
  private lastSyncAt = 0;
  private recentMutations = new Map<string, number>();

  constructor() {
    this.isDemo = !isSupabaseConfigured();
    this.ensureInitialized();
    this.initSupabaseRealtime();
    if (typeof window !== 'undefined') {
      this.syncOrdersFromSupabase(false, true);
    }
  }

  public getIsDemo(): boolean {
    return this.isDemo;
  }

  private markMutated(orderId: string) {
    this.recentMutations.set(orderId, Date.now());
  }

  private wasRecentlyMutated(orderId?: string): boolean {
    if (!orderId) return false;
    const ts = this.recentMutations.get(orderId);
    if (!ts) return false;
    if (Date.now() - ts < 4000) return true;
    this.recentMutations.delete(orderId);
    return false;
  }

  private initSupabaseRealtime() {
    if (this.realtimeInitialized || typeof window === 'undefined' || !isSupabaseConfigured() || !supabase) {
      return;
    }
    this.realtimeInitialized = true;

    supabase
      .channel('dineflow-orders-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          const changedId = payload?.new?.id || payload?.old?.id;
          const isRemoteInsert = payload.eventType === 'INSERT' && !this.wasRecentlyMutated(changedId);
          this.syncOrdersFromSupabase(isRemoteInsert, true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_items' },
        () => {
          this.syncOrdersFromSupabase(false, true);
        }
      )
      .subscribe();
  }

  private mapSupabaseOrder(row: any): Order {
    const parsedTableNum =
      row.table_number ??
      (Number(String(row.table_id || '').replace(/\D/g, '')) || 1);

    const items: OrderItem[] = Array.isArray(row.order_items)
      ? row.order_items.map((it: any) => {
          const unitPrice = Number(it.unit_price ?? it.price) || 0;
          const qty = Number(it.quantity) || 1;
          return {
            id: it.id,
            order_id: it.order_id,
            menu_item_id: it.menu_item_id || '',
            item_name: it.item_name || it.name || 'Taom',
            unit_price: unitPrice,
            quantity: qty,
            item_note: it.item_note || '',
            line_total: Number(it.line_total) || unitPrice * qty,
          };
        })
      : [];

    return {
      id: row.id,
      order_number: row.order_number,
      table_id: row.table_id,
      table_number: parsedTableNum,
      status: (row.status || 'new') as OrderStatus,
      total_amount: Number(row.total_amount) || 0,
      customer_note: row.customer_note || '',
      waiter_name: row.waiter_name || "Mas'ul ofitsiant",
      waiter_called: Boolean(row.waiter_called),
      bill_requested: Boolean(row.bill_requested),
      items,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || row.created_at || new Date().toISOString(),
    };
  }

  private async syncOrdersFromSupabase(isRemoteInsert = false, force = false): Promise<void> {
    if (!isSupabaseConfigured() || !supabase || this.isSyncingOrders) return;
    if (!force && Date.now() - this.lastSyncAt < 2500) return;

    this.isSyncingOrders = true;
    this.lastSyncAt = Date.now();

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) {
        console.warn('Supabase sync error:', error.message);
        return;
      }

      const remoteOrders = (data || []).map((row) => this.mapSupabaseOrder(row));
      const rawLocal = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const localOrders: Order[] = rawLocal ? JSON.parse(rawLocal) : [];

      const remoteMap = new Map(remoteOrders.map((o) => [o.id, o]));
      // Keep recent local mutations intact if server hasn't caught up yet,
      // and preserve local loyalty metadata fields not stored in Supabase schema.
      const mergedRemote = remoteOrders.map((ro) => {
        const localMatch = localOrders.find((lo) => lo.id === ro.id);
        if (this.wasRecentlyMutated(ro.id)) {
          return localMatch || ro;
        }
        if (localMatch) {
          return {
            ...ro,
            subtotal_amount: localMatch.subtotal_amount ?? ro.subtotal_amount,
            cashback_used: localMatch.cashback_used ?? ro.cashback_used,
            cashback_earned: localMatch.cashback_earned ?? ro.cashback_earned,
            customer_account_id: localMatch.customer_account_id ?? ro.customer_account_id,
            customer_name: localMatch.customer_name ?? ro.customer_name,
          };
        }
        return ro;
      });

      const localOnly = localOrders.filter((o) => !remoteMap.has(o.id));
      const merged = [...mergedRemote, ...localOnly].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const prevFingerprint = localOrders.map((o) => `${o.id}:${o.status}:${o.items?.length || 0}`).join('|');
      const nextFingerprint = merged.map((o) => `${o.id}:${o.status}:${o.items?.length || 0}`).join('|');

      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));

      if (prevFingerprint !== nextFingerprint) {
        if (isRemoteInsert) {
          soundService.playTick();
        }
        emitRealtimeEvent('orders', {
          action: isRemoteInsert ? 'order_created' : 'order_status_changed',
        });
      }
    } catch (e) {
      console.warn('Supabase syncOrders exception:', e);
    } finally {
      this.isSyncingOrders = false;
    }
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }

    const existingMenu = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    let shouldSeedMenu = !existingMenu;
    if (existingMenu) {
      try {
        const parsed = JSON.parse(existingMenu);
        if (
          !Array.isArray(parsed) ||
          parsed.length < 30 ||
          parsed.some((d: any) => !d.tier || d.image_url?.startsWith('/src/assets') || !d.image_url?.startsWith('/images/dishes/'))
        ) {
          shouldSeedMenu = true;
        }
      } catch {
        shouldSeedMenu = true;
      }
    }
    if (shouldSeedMenu) {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
    }

    const existingTables = localStorage.getItem(STORAGE_KEYS.TABLES);
    let shouldSeedTables = !existingTables;
    if (existingTables) {
      try {
        const parsed = JSON.parse(existingTables);
        if (!Array.isArray(parsed) || parsed.length < 25 || parsed.some((t: any) => !t.tier)) {
          shouldSeedTables = true;
        }
      } catch {
        shouldSeedTables = true;
      }
    }
    if (shouldSeedTables) {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    }

    const existingOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    let shouldSeedOrders = !existingOrders;
    if (existingOrders) {
      try {
        const parsed = JSON.parse(existingOrders);
        if (!Array.isArray(parsed)) {
          shouldSeedOrders = true;
        }
      } catch {
        shouldSeedOrders = true;
      }
    }
    if (shouldSeedOrders) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SERVICE_CALLS)) {
      localStorage.setItem(STORAGE_KEYS.SERVICE_CALLS, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.WAITERS)) {
      localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(INITIAL_WAITERS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.DISH_REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.DISH_REVIEWS, JSON.stringify(INITIAL_DISH_REVIEWS));
    }
  }

  // --- CATEGORIES ---
  public async getCategories(): Promise<Category[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : INITIAL_CATEGORIES;
  }

  public async saveCategory(category: Category): Promise<Category> {
    const current = await this.getCategories();
    const idx = current.findIndex((c) => c.id === category.id);
    const updated = idx >= 0 ? current.map((c, i) => (i === idx ? category : c)) : [...current, category];
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    emitRealtimeEvent('menu');

    if (isSupabaseConfigured() && supabase) {
      supabase.from('categories').upsert(category).then(() => {});
    }
    return category;
  }

  public async deleteCategory(id: string): Promise<void> {
    const current = await this.getCategories();
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(current.filter((c) => c.id !== id)));
    emitRealtimeEvent('menu');

    if (isSupabaseConfigured() && supabase) {
      supabase.from('categories').delete().eq('id', id).then(() => {});
    }
  }

  // --- MENU ITEMS ---
  public async getMenuItems(): Promise<MenuItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    return raw ? JSON.parse(raw) : INITIAL_MENU_ITEMS;
  }

  public async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    item.updated_at = new Date().toISOString();
    if (!item.id) {
      item.id = 'dish-' + Date.now();
      item.created_at = new Date().toISOString();
    }
    const current = await this.getMenuItems();
    const idx = current.findIndex((m) => m.id === item.id);
    const updated = idx >= 0 ? current.map((m, i) => (i === idx ? item : m)) : [item, ...current];
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(updated));
    emitRealtimeEvent('menu');

    if (isSupabaseConfigured() && supabase) {
      supabase.from('menu_items').upsert(item).then(() => {});
    }
    return item;
  }

  public async deleteMenuItem(id: string): Promise<void> {
    const current = await this.getMenuItems();
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(current.filter((m) => m.id !== id)));
    emitRealtimeEvent('menu');

    if (isSupabaseConfigured() && supabase) {
      supabase.from('menu_items').delete().eq('id', id).then(() => {});
    }
  }

  public async toggleDishAvailability(id: string, isAvailable: boolean): Promise<void> {
    const items = await this.getMenuItems();
    const target = items.find((m) => m.id === id);
    if (target) {
      target.is_available = isAvailable;
      await this.saveMenuItem(target);
    }
  }

  // --- TABLES ---
  public async getTables(): Promise<RestaurantTable[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.TABLES);
    return raw ? JSON.parse(raw) : INITIAL_TABLES;
  }

  public async saveTable(table: RestaurantTable): Promise<RestaurantTable> {
    if (!table.id) {
      table.id = 'table-' + Date.now();
      table.created_at = new Date().toISOString();
      table.qr_token = `qr-${table.table_number}-${Math.random().toString(36).substring(2, 8)}`;
    }
    const current = await this.getTables();
    const idx = current.findIndex((t) => t.id === table.id);
    const updated =
      idx >= 0
        ? current.map((t, i) => (i === idx ? table : t))
        : [...current, table].sort((a, b) => a.table_number - b.table_number);
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
    emitRealtimeEvent('tables');

    if (isSupabaseConfigured() && supabase) {
      supabase.from('restaurant_tables').upsert(table).then(() => {});
    }
    return table;
  }

  public async deleteTable(id: string): Promise<void> {
    const current = await this.getTables();
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(current.filter((t) => t.id !== id)));
    emitRealtimeEvent('tables');

    if (isSupabaseConfigured() && supabase) {
      supabase.from('restaurant_tables').delete().eq('id', id).then(() => {});
    }
  }

  // --- ORDERS (INSTANT LOCAL READ + BACKGROUND SUPABASE SYNC) ---
  public async getOrders(): Promise<Order[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const localOrders: Order[] = raw ? JSON.parse(raw) : INITIAL_ORDERS;

    // Trigger throttled background sync without blocking UI
    this.syncOrdersFromSupabase(false, false);

    return localOrders;
  }

  public async createOrder(params: {
    tableNumber: number;
    cartItems: CartItem[];
    customerNote?: string;
    cashbackUsed?: number;
    cashbackEarned?: number;
    customerAccountId?: string;
    customerName?: string;
  }): Promise<Order> {
    const {
      tableNumber,
      cartItems,
      customerNote,
      cashbackUsed = 0,
      cashbackEarned = 0,
      customerAccountId,
      customerName,
    } = params;

    const rawTables = localStorage.getItem(STORAGE_KEYS.TABLES);
    const allTables: RestaurantTable[] = rawTables ? JSON.parse(rawTables) : INITIAL_TABLES;
    const table = allTables.find((t) => t.table_number === tableNumber) || {
      id: `table-${tableNumber}`,
      table_number: tableNumber,
      assigned_waiter_name: 'Karimov Dilshod',
    };

    const rawDishes = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    const allDishes: MenuItem[] = rawDishes ? JSON.parse(rawDishes) : INITIAL_MENU_ITEMS;
    const dishMap = new Map<string, MenuItem>(allDishes.map((d) => [d.id, d]));

    let calculatedTotal = 0;
    const orderId = 'order-' + Date.now();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    const orderItems: OrderItem[] = cartItems.map((cart, idx) => {
      const liveDish = dishMap.get(cart.menuItem.id) || cart.menuItem;
      const verifiedUnitPrice = liveDish.price;
      const verifiedLineTotal = verifiedUnitPrice * cart.quantity;
      calculatedTotal += verifiedLineTotal;

      return {
        id: `item-${orderId}-${idx + 1}`,
        order_id: orderId,
        menu_item_id: liveDish.id,
        item_name: liveDish.name,
        unit_price: verifiedUnitPrice,
        quantity: cart.quantity,
        item_note: cart.item_note || '',
        line_total: verifiedLineTotal,
      };
    });

    const safeCashbackUsed = Math.min(calculatedTotal, Math.max(0, Math.round(cashbackUsed)));
    const safeCashbackEarned = Math.max(0, Math.round(cashbackEarned));
    const finalPayableTotal = Math.max(0, calculatedTotal - safeCashbackUsed);

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      table_id: table.id,
      table_number: table.table_number,
      status: 'new',
      subtotal_amount: calculatedTotal,
      cashback_used: safeCashbackUsed,
      cashback_earned: safeCashbackEarned,
      customer_account_id: customerAccountId,
      customer_name: customerName,
      total_amount: finalPayableTotal,
      customer_note: customerNote || '',
      waiter_name: table.assigned_waiter_name || "Mas'ul ofitsiant",
      items: orderItems,
      created_at: now,
      updated_at: now,
    };

    this.markMutated(orderId);
    const rawOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const currentOrders: Order[] = rawOrders ? JSON.parse(rawOrders) : INITIAL_ORDERS;
    const updatedOrders = [newOrder, ...currentOrders.filter((o) => o.id !== newOrder.id)];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

    soundService.playTick();
    emitRealtimeEvent('orders', {
      action: 'order_created',
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
      tableNumber: newOrder.table_number,
      totalAmount: newOrder.total_amount,
      itemsCount: newOrder.items.length,
    });

    // Non-blocking background write to Supabase (strictly valid schema columns only)
    if (isSupabaseConfigured() && supabase) {
      const loyaltyTagParts: string[] = [];
      if (customerName) loyaltyTagParts.push(`Mijoz: ${customerName}`);
      if (safeCashbackUsed > 0) {
        loyaltyTagParts.push(`Keshbek: -${safeCashbackUsed.toLocaleString('uz-UZ')} so'm`);
      }
      const loyaltyTag = loyaltyTagParts.length > 0 ? `[${loyaltyTagParts.join(' · ')}]` : '';
      const supabaseCustomerNote = [loyaltyTag, newOrder.customer_note].filter(Boolean).join(' ').trim();

      const orderPayload = {
        id: newOrder.id,
        order_number: newOrder.order_number,
        table_id: newOrder.table_id,
        table_number: newOrder.table_number,
        status: newOrder.status,
        total_amount: newOrder.total_amount,
        customer_note: supabaseCustomerNote,
        waiter_name: newOrder.waiter_name,
        waiter_called: false,
        bill_requested: false,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
      };

      const itemsPayload = orderItems.map((it) => ({
        id: it.id,
        order_id: it.order_id,
        menu_item_id: it.menu_item_id,
        item_name: it.item_name,
        unit_price: it.unit_price,
        quantity: it.quantity,
        item_note: it.item_note,
        line_total: it.line_total,
      }));

      (async () => {
        try {
          let { error: orderError } = await supabase!.from('orders').insert(orderPayload);
          if (orderError && orderError.code === '23503') {
            await supabase!.from('restaurant_tables').upsert(
              { id: table.id, table_number: table.table_number },
              { onConflict: 'id', ignoreDuplicates: true }
            );
            const retry = await supabase!.from('orders').insert(orderPayload);
            orderError = retry.error;
          }
          if (!orderError && itemsPayload.length > 0) {
            await supabase!.from('order_items').insert(itemsPayload);
          }
        } catch (e) {
          console.error('Supabase background createOrder error:', e);
        }
      })();
    }

    return newOrder;
  }

  public async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | null> {
    this.markMutated(orderId);
    const rawOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const currentOrders: Order[] = rawOrders ? JSON.parse(rawOrders) : INITIAL_ORDERS;
    const target = currentOrders.find((o) => o.id === orderId);
    const now = new Date().toISOString();

    if (target) {
      target.status = newStatus;
      if (newStatus === 'cancelled') {
        target.cashback_earned = 0;
      }
      target.updated_at = now;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));
    }

    if (newStatus === 'ready') {
      soundService.playSuccess();
    } else {
      soundService.playTick();
    }

    emitRealtimeEvent('orders', {
      action: 'order_status_changed',
      orderId,
      orderNumber: target?.order_number,
      tableNumber: target?.table_number,
      newStatus,
    });

    // Non-blocking background update to Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('orders')
        .update({ status: newStatus, updated_at: now })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Supabase updateOrderStatus error:', error.message);
        });
    }

    return target || null;
  }

  // Strictly cancel order ONLY while it is in 'new' (1-tick) status before waiter accepts it
  public async cancelOrder(orderId: string): Promise<{
    ok: boolean;
    order?: Order;
    reason?: 'not_found' | 'already_accepted';
  }> {
    const rawOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const currentOrders: Order[] = rawOrders ? JSON.parse(rawOrders) : INITIAL_ORDERS;
    const target = currentOrders.find((o) => o.id === orderId);

    if (!target) {
      return { ok: false, reason: 'not_found' };
    }

    if (target.status !== 'new') {
      return { ok: false, reason: 'already_accepted', order: { ...target } };
    }

    this.markMutated(orderId);
    const now = new Date().toISOString();
    target.status = 'cancelled';
    target.cashback_earned = 0;
    target.updated_at = now;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));

    soundService.playTick();
    emitRealtimeEvent('orders', {
      action: 'order_cancelled',
      orderId,
      orderNumber: target.order_number,
      tableNumber: target.table_number,
      newStatus: 'cancelled',
    });

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: now })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Supabase cancelOrder error:', error.message);
        });
    }

    return { ok: true, order: { ...target } };
  }

  // --- SERVICE CALLS ---
  public async getServiceCalls(): Promise<ServiceCall[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_CALLS);
    return raw ? JSON.parse(raw) : [];
  }

  public async requestService(tableNumber: number, type: 'waiter' | 'bill' | 'water', note?: string): Promise<ServiceCall> {
    const allTables = await this.getTables();
    const table = allTables.find((t) => t.table_number === tableNumber);
    const waiters = await this.getWaiters();
    const assignedWaiter = waiters.find((w) => w.assigned_tables?.includes(tableNumber));
    const waiterName = assignedWaiter
      ? `${assignedWaiter.badge_id} · ${assignedWaiter.full_name}`
      : table?.assigned_waiter_name || 'Karimov Dilshod';

    const currentCalls = await this.getServiceCalls();
    const existingPending = currentCalls.find(
      (c) => c.table_number === tableNumber && c.status === 'pending'
    );
    const otherPendingCalls = currentCalls.filter(
      (c) => !(c.table_number === tableNumber && c.status === 'pending') && c.status === 'pending'
    );

    const newCallCount = existingPending ? (existingPending.call_count || 1) + 1 : 1;
    const isEscalated = newCallCount >= 2 || otherPendingCalls.length + 1 >= 3;

    const defaultNote =
      type === 'waiter'
        ? newCallCount >= 2
          ? `Mijoz ${newCallCount}-marta ofitsiantni chaqirmoqda (Ofitsiant kelmadi!)`
          : 'Ofitsiant chaqirildi'
        : type === 'bill'
        ? "Hisob so'radi"
        : "Choy/suv to'ldirish";

    const call: ServiceCall = {
      id: existingPending ? existingPending.id : 'call-' + Date.now(),
      table_id: table ? table.id : `table-${tableNumber}`,
      table_number: tableNumber,
      type,
      note: note || defaultNote,
      created_at: existingPending ? existingPending.created_at : new Date().toISOString(),
      last_called_at: new Date().toISOString(),
      call_count: newCallCount,
      escalated_to_admin: isEscalated,
      assigned_waiter_name: waiterName,
      status: 'pending',
    };

    const updated = [
      call,
      ...currentCalls.filter((c) => !(c.table_number === tableNumber && c.status === 'pending')),
    ];
    localStorage.setItem(STORAGE_KEYS.SERVICE_CALLS, JSON.stringify(updated));

    const currentOrders = await this.getOrders();
    const activeOrder = currentOrders.find(
      (o) => o.table_number === tableNumber && o.status !== 'delivered' && o.status !== 'cancelled'
    );
    if (activeOrder) {
      this.markMutated(activeOrder.id);
      if (type === 'waiter') activeOrder.waiter_called = true;
      if (type === 'bill') activeOrder.bill_requested = true;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));

      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('orders')
          .update({
            waiter_called: activeOrder.waiter_called,
            bill_requested: activeOrder.bill_requested,
          })
          .eq('id', activeOrder.id)
          .then(() => {});
      }
    }

    soundService.playTick();
    emitRealtimeEvent('service', {
      action: 'service_call_created',
      callId: call.id,
      tableNumber,
      serviceType: type,
      serviceNote: call.note,
      callCount: call.call_count,
      escalatedToAdmin: call.escalated_to_admin,
      assignedWaiterName: call.assigned_waiter_name,
    });

    return call;
  }

  public async resolveServiceCall(callId: string): Promise<void> {
    const currentCalls = await this.getServiceCalls();
    const target = currentCalls.find((c) => c.id === callId);
    const updated = currentCalls.map((c) => (c.id === callId ? { ...c, status: 'resolved' as const } : c));
    localStorage.setItem(STORAGE_KEYS.SERVICE_CALLS, JSON.stringify(updated));

    if (target) {
      const currentOrders = await this.getOrders();
      const activeOrder = currentOrders.find((o) => o.table_number === target.table_number);
      if (activeOrder) {
        this.markMutated(activeOrder.id);
        activeOrder.waiter_called = false;
        activeOrder.bill_requested = false;
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));
      }
    }

    soundService.playTick();
    emitRealtimeEvent('service', {
      action: 'service_call_resolved',
      callId,
      tableNumber: target?.table_number,
      assignedWaiterName: target?.assigned_waiter_name,
    });
  }

  // --- STOLNI TO'LASH VA BO'SHATISH ---
  public async settleAndFreeTable(tableNumber: number): Promise<void> {
    const currentOrders = await this.getOrders();
    const now = new Date().toISOString();
    const toSettleIds: string[] = [];

    currentOrders.forEach((o) => {
      if (o.table_number === tableNumber && o.status !== 'delivered' && o.status !== 'cancelled') {
        this.markMutated(o.id);
        o.status = 'delivered';
        o.bill_requested = false;
        o.waiter_called = false;
        o.updated_at = now;
        toSettleIds.push(o.id);
      }
    });

    if (toSettleIds.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));
      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('orders')
          .update({
            status: 'delivered',
            bill_requested: false,
            waiter_called: false,
            updated_at: now,
          })
          .in('id', toSettleIds)
          .then(() => {});
      }
    }

    const currentCalls = await this.getServiceCalls();
    const updatedCalls = currentCalls.map((c) =>
      c.table_number === tableNumber && c.status === 'pending'
        ? { ...c, status: 'resolved' as const }
        : c
    );
    localStorage.setItem(STORAGE_KEYS.SERVICE_CALLS, JSON.stringify(updatedCalls));

    soundService.playSuccess();
    emitRealtimeEvent('orders', {
      action: 'table_settled_and_freed',
      tableNumber,
    });
    emitRealtimeEvent('service', {
      action: 'table_settled_and_freed',
      tableNumber,
    });
  }

  // --- WAITERS ---
  public async getWaiters(): Promise<Waiter[]> {
    if (typeof window === 'undefined') return INITIAL_WAITERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WAITERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(INITIAL_WAITERS));
        return INITIAL_WAITERS;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(INITIAL_WAITERS));
        return INITIAL_WAITERS;
      }
      return parsed as Waiter[];
    } catch {
      return INITIAL_WAITERS;
    }
  }

  public async saveWaiter(waiter: Waiter): Promise<void> {
    const waiters = await this.getWaiters();
    const existingIndex = waiters.findIndex((w) => w.id === waiter.id);
    const updated =
      existingIndex >= 0
        ? waiters.map((w, i) => (i === existingIndex ? { ...waiter, updated_at: new Date().toISOString() } : w))
        : [waiter, ...waiters];
    localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(updated));
    emitRealtimeEvent('waiters');
  }

  public async deleteWaiter(id: string): Promise<void> {
    const waiters = await this.getWaiters();
    localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(waiters.filter((w) => w.id !== id)));
    emitRealtimeEvent('waiters');
  }

  public async updateWaiterStatus(id: string, status: WaiterShiftStatus): Promise<void> {
    const waiters = await this.getWaiters();
    const updated = waiters.map((w) =>
      w.id === id ? { ...w, status, updated_at: new Date().toISOString() } : w
    );
    localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(updated));
    emitRealtimeEvent('waiters');
  }

  // --- FEEDBACKS ---
  public async getFeedbacks(): Promise<CustomerFeedback[]> {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async saveFeedback(feedback: CustomerFeedback): Promise<void> {
    const list = await this.getFeedbacks();
    const updated = [feedback, ...list.filter((f) => f.id !== feedback.id)];
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(updated));

    const orders = await this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === feedback.order_id);
    if (orderIndex >= 0) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        rating: feedback.overall_rating,
        customer_review: {
          overall_rating: feedback.overall_rating,
          food_rating: feedback.food_rating,
          speed_rating: feedback.speed_rating,
          waiter_rating: feedback.waiter_rating,
          atmosphere_rating: feedback.atmosphere_rating,
          tags: feedback.tags,
          comment: feedback.comment,
          customer_name: feedback.customer_name,
          tip_amount: feedback.tip_amount,
          submitted_at: feedback.created_at,
        },
      };
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }

    if (feedback.waiter_name) {
      const waiters = await this.getWaiters();
      const matched = waiters.find((w) => w.full_name === feedback.waiter_name);
      if (matched) {
        const curRating = matched.rating || 5.0;
        const curOrders = matched.orders_serviced || 0;
        const newRating = Number(((curRating * curOrders + feedback.overall_rating) / (curOrders + 1)).toFixed(1));
        await this.saveWaiter({
          ...matched,
          rating: newRating,
          orders_serviced: curOrders + 1,
        });
      }
    }

    emitRealtimeEvent('orders');
    emitRealtimeEvent('reviews');
  }

  // --- DISH REVIEWS ---
  public async getDishReviews(): Promise<DishReview[]> {
    if (typeof window === 'undefined') return INITIAL_DISH_REVIEWS;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DISH_REVIEWS);
      return raw ? JSON.parse(raw) : INITIAL_DISH_REVIEWS;
    } catch {
      return INITIAL_DISH_REVIEWS;
    }
  }

  public async saveDishReview(review: DishReview): Promise<DishReview> {
    const current = await this.getDishReviews();
    const updated = [review, ...current.filter((r) => r.id !== review.id)];
    localStorage.setItem(STORAGE_KEYS.DISH_REVIEWS, JSON.stringify(updated));

    soundService.playSuccess();
    emitRealtimeEvent('reviews', {
      action: 'dish_review_added',
      tableNumber: review.table_number,
    });

    return review;
  }

  public async resetAllDemoData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.MENU_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SERVICE_CALLS);
    localStorage.removeItem(STORAGE_KEYS.WAITERS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACKS);
    localStorage.removeItem(STORAGE_KEYS.DISH_REVIEWS);
    this.ensureInitialized();
    emitRealtimeEvent('orders');
    emitRealtimeEvent('menu');
    emitRealtimeEvent('tables');
    emitRealtimeEvent('service');
    emitRealtimeEvent('waiters');
    emitRealtimeEvent('reviews');
  }
}

export const dataService = new DataService();