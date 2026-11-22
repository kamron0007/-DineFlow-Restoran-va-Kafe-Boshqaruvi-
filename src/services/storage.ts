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
} from '../types';
import {
  INITIAL_CATEGORIES,
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
};

// Cross-tab real-time event channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('dineflow_realtime_channel');
  }
} catch {
  // Ignore fallback
}

export interface RealtimeEventData {
  type: 'orders' | 'tables' | 'menu' | 'service' | 'waiters';
  action?: 'order_status_changed' | 'order_created' | 'service_call_created' | 'service_call_resolved' | 'table_settled_and_freed';
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

export const emitRealtimeEvent = (type: 'orders' | 'tables' | 'menu' | 'service' | 'waiters', data?: Partial<RealtimeEventData>) => {
  const detail: RealtimeEventData = { type, ...data };
  window.dispatchEvent(new CustomEvent('dineflow:sync', { detail }));
  if (broadcastChannel) {
    broadcastChannel.postMessage(detail);
  }
};

class DataService {
  private isDemo: boolean;

  constructor() {
    this.isDemo = !isSupabaseConfigured();
    this.ensureInitialized();
  }

  public getIsDemo(): boolean {
    return this.isDemo;
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
        if (!Array.isArray(parsed) || parsed.length < 20) {
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
      localStorage.setItem(
        STORAGE_KEYS.SERVICE_CALLS,
        JSON.stringify([
          {
            id: 'call-1',
            table_id: 'table-14',
            table_number: 14,
            type: 'waiter',
            note: "Iltimos, qo'shimcha choynak va stakan olib keling",
            created_at: new Date(Date.now() - 2 * 60000).toISOString(),
            status: 'pending',
          },
        ])
      );
    }

    if (!localStorage.getItem(STORAGE_KEYS.WAITERS)) {
      localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(INITIAL_WAITERS));
    }
  }

  // --- CATEGORIES (Instant local read + background sync) ---
  public async getCategories(): Promise<Category[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const localData: Category[] = raw ? JSON.parse(raw) : INITIAL_CATEGORIES;

    // Background sync from REST API without blocking UI render
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Category[] | null) => {
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data));
        }
      })
      .catch(() => {});

    return localData;
  }

  public async saveCategory(category: Category): Promise<Category> {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (res.ok) {
        const saved = (await res.json()) as Category;
        const current = await this.getCategories();
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(current));
        emitRealtimeEvent('menu');
        return saved;
      }
    } catch {
      // Fallback below
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('categories').upsert(category).select().single();
        if (!error && data) {
          emitRealtimeEvent('menu');
          return data as Category;
        }
      } catch (e) {
        console.warn('Supabase saveCategory error:', e);
      }
    }
    const current = await this.getCategories();
    const idx = current.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = category;
    } else {
      updated = [...current, category];
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    emitRealtimeEvent('menu');
    return category;
  }

  public async deleteCategory(id: string): Promise<void> {
    try {
      await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Ignore error
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteCategory error:', e);
      }
    }
    const current = await this.getCategories();
    const filtered = current.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    emitRealtimeEvent('menu');
  }

  // --- MENU ITEMS (Instant local read + background sync) ---
  public async getMenuItems(): Promise<MenuItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    const localData: MenuItem[] = raw ? JSON.parse(raw) : INITIAL_MENU_ITEMS;

    fetch('/api/menu')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MenuItem[] | null) => {
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(data));
        }
      })
      .catch(() => {});

    return localData;
  }

  public async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    item.updated_at = new Date().toISOString();
    const isNew = !item.id;
    if (isNew) {
      item.id = 'dish-' + Date.now();
      item.created_at = new Date().toISOString();
    }
    try {
      const res = await fetch(isNew ? '/api/menu' : `/api/menu/${encodeURIComponent(item.id)}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const saved = (await res.json()) as MenuItem;
        await this.getMenuItems();
        emitRealtimeEvent('menu');
        return saved;
      } else if (res.status === 404) {
        const postRes = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (postRes.ok) {
          const saved = (await postRes.json()) as MenuItem;
          await this.getMenuItems();
          emitRealtimeEvent('menu');
          return saved;
        }
      }
    } catch {
      // Fallback below
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('menu_items').upsert(item).select().single();
        if (!error && data) {
          emitRealtimeEvent('menu');
          return data as MenuItem;
        }
      } catch (e) {
        console.warn('Supabase saveMenuItem error:', e);
      }
    }
    const current = await this.getMenuItems();
    const idx = current.findIndex((m) => m.id === item.id);
    let updated: MenuItem[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = item;
    } else {
      updated = [item, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(updated));
    emitRealtimeEvent('menu');
    return item;
  }

  public async deleteMenuItem(id: string): Promise<void> {
    try {
      await fetch(`/api/menu/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Ignore error
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('menu_items').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteMenuItem error:', e);
      }
    }
    const current = await this.getMenuItems();
    const filtered = current.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(filtered));
    emitRealtimeEvent('menu');
  }

  public async toggleDishAvailability(id: string, isAvailable: boolean): Promise<void> {
    const items = await this.getMenuItems();
    const target = items.find((m) => m.id === id);
    if (target) {
      target.is_available = isAvailable;
      await this.saveMenuItem(target);
    }
  }

  // --- TABLES (Instant local read) ---
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
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('restaurant_tables').upsert(table).select().single();
        if (!error && data) {
          emitRealtimeEvent('tables');
          return data as RestaurantTable;
        }
      } catch (e) {
        console.warn('Supabase saveTable error:', e);
      }
    }
    const current = await this.getTables();
    const idx = current.findIndex((t) => t.id === table.id);
    let updated: RestaurantTable[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = table;
    } else {
      updated = [...current, table].sort((a, b) => a.table_number - b.table_number);
    }
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated));
    emitRealtimeEvent('tables');
    return table;
  }

  public async deleteTable(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('restaurant_tables').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteTable error:', e);
      }
    }
    const current = await this.getTables();
    const filtered = current.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(filtered));
    emitRealtimeEvent('tables');
  }

  // --- ORDERS (Instant local read + background sync) ---
  public async getOrders(): Promise<Order[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const localOrders: Order[] = raw ? JSON.parse(raw) : INITIAL_ORDERS;

    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverOrders: Order[] | null) => {
        if (Array.isArray(serverOrders) && serverOrders.length > 0) {
          const currentRaw = localStorage.getItem(STORAGE_KEYS.ORDERS);
          const currentLocal: Order[] = currentRaw ? JSON.parse(currentRaw) : [];
          const serverMap = new Map(serverOrders.map((o) => [o.id, o]));
          const merged = [
            ...currentLocal.filter((o) => !serverMap.has(o.id)),
            ...serverOrders,
          ];
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
        }
      })
      .catch(() => {});

    return localOrders;
  }

  /**
   * Instant order creation (< 2ms): validates synchronously against cached menu & tables,
   * writes immediately to localStorage, and syncs to /api/orders in the background.
   */
  public async createOrder(params: {
    tableNumber: number;
    cartItems: CartItem[];
    customerNote?: string;
  }): Promise<Order> {
    const { tableNumber, cartItems, customerNote } = params;

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

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      table_id: table.id,
      table_number: table.table_number,
      status: 'new',
      total_amount: calculatedTotal,
      customer_note: customerNote || '',
      waiter_name: table.assigned_waiter_name || "Mas'ul ofitsiant",
      items: orderItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

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

    // Non-blocking background sync to Express REST API
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newOrder.id,
        order_number: newOrder.order_number,
        table_id: newOrder.table_id,
        table_number: newOrder.table_number,
        customer_note: newOrder.customer_note,
        waiter_name: newOrder.waiter_name,
        items: newOrder.items,
      }),
    }).catch(() => {});

    return newOrder;
  }

  public async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | null> {
    const rawOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const currentOrders: Order[] = rawOrders ? JSON.parse(rawOrders) : INITIAL_ORDERS;
    const target = currentOrders.find((o) => o.id === orderId);
    if (!target) return null;

    target.status = newStatus;
    target.updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));

    if (newStatus === 'ready') {
      soundService.playSuccess();
    } else {
      soundService.playTick();
    }

    emitRealtimeEvent('orders', {
      action: 'order_status_changed',
      orderId: target.id,
      orderNumber: target.order_number,
      tableNumber: target.table_number,
      newStatus,
    });

    // Background sync
    fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {});

    return target;
  }

  // --- SERVICE CALLS (Ofitsiantni chaqirish, Hisob so'rash) ---
  public async getServiceCalls(): Promise<ServiceCall[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_CALLS);
    const localCalls: ServiceCall[] = raw ? JSON.parse(raw) : [];

    // Non-blocking background sync from server API
    fetch('/api/service-calls')
      .then((res) => (res.ok ? res.json() : null))
      .then((remoteCalls: ServiceCall[] | null) => {
        if (Array.isArray(remoteCalls) && remoteCalls.length > 0) {
          const map = new Map<string, ServiceCall>();
          localCalls.forEach((c) => map.set(c.id, c));
          let changed = false;
          remoteCalls.forEach((rc) => {
            const existing = map.get(rc.id);
            if (!existing || existing.status !== rc.status || existing.call_count !== rc.call_count) {
              map.set(rc.id, rc);
              changed = true;
            }
          });
          if (changed) {
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            localStorage.setItem(STORAGE_KEYS.SERVICE_CALLS, JSON.stringify(merged));
          }
        }
      })
      .catch(() => {});

    return localCalls;
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
    // Escalate to Admin ONLY if customer called 2+ times (waiter didn't come) OR total pending calls across tables >= 3 ("ko'payib ketsa")
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

    // Also update any active orders on that table to flag waiter_called
    const currentOrders = await this.getOrders();
    const activeOrder = currentOrders.find(
      (o) => o.table_number === tableNumber && o.status !== 'delivered' && o.status !== 'cancelled'
    );
    if (activeOrder) {
      if (type === 'waiter') activeOrder.waiter_called = true;
      if (type === 'bill') activeOrder.bill_requested = true;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));
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

    // Background sync to Express API
    fetch('/api/service-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: call.id,
        table_id: call.table_id,
        table_number: tableNumber,
        type,
        note: call.note,
        call_count: call.call_count,
        escalated_to_admin: call.escalated_to_admin,
        assigned_waiter_name: waiterName,
      }),
    }).catch(() => {});

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

    // Background sync to Express API
    fetch(`/api/service-calls/${encodeURIComponent(callId)}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: target?.table_number }),
    }).catch(() => {});
  }

  // --- STOLNI TO'LASH VA BO'SHATISH (Chek olingandan so'ng bo'shatish) ---
  public async settleAndFreeTable(tableNumber: number): Promise<void> {
    const currentOrders = await this.getOrders();
    let updatedAny = false;
    currentOrders.forEach((o) => {
      if (o.table_number === tableNumber && o.status !== 'delivered' && o.status !== 'cancelled') {
        o.status = 'delivered';
        o.bill_requested = false;
        o.waiter_called = false;
        o.updated_at = new Date().toISOString();
        updatedAny = true;
      }
    });
    if (updatedAny) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(currentOrders));
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

  // --- WAITERS (OFITSIANTLAR) ---
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
    let updated: Waiter[];
    if (existingIndex >= 0) {
      updated = [...waiters];
      updated[existingIndex] = { ...waiter, updated_at: new Date().toISOString() };
    } else {
      updated = [waiter, ...waiters];
    }
    localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(updated));
    emitRealtimeEvent('waiters');
  }

  public async deleteWaiter(id: string): Promise<void> {
    const waiters = await this.getWaiters();
    const filtered = waiters.filter((w) => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(filtered));
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

  // --- FEEDBACKS (BAHOLAR VA IZOHLAR) ---
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

    // Also update order review and rating
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

    // If order has an assigned waiter, update waiter rating
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
  }

  public async resetAllDemoData(): Promise<void> {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {
      // Ignore error
    }
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.MENU_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SERVICE_CALLS);
    localStorage.removeItem(STORAGE_KEYS.WAITERS);
    this.ensureInitialized();
    emitRealtimeEvent('orders');
    emitRealtimeEvent('menu');
    emitRealtimeEvent('tables');
    emitRealtimeEvent('service');
    emitRealtimeEvent('waiters');
  }
}

export const dataService = new DataService();
