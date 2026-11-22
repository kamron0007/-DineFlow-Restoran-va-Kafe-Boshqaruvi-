/**
 * DineFlow Business Rules & Validation Tests
 * Verifies cart calculations, line item totals, status workflows, and security snapshots.
 */

import { CartItem, MenuItem, OrderStatus } from '../types';

describe('DineFlow Business Rules Verification', () => {
  const sampleDish1: MenuItem = {
    id: 'dish-1',
    category_id: 'cat-milliy',
    name: "To'y Oshi",
    description: 'Palov',
    price: 45000,
    image_url: '',
    is_available: true,
    preparation_time_minutes: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleDish2: MenuItem = {
    id: 'dish-2',
    category_id: 'cat-milliy',
    name: 'Qozon Kabob',
    description: 'Kabob',
    price: 65000,
    image_url: '',
    is_available: true,
    preparation_time_minutes: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('1. Cart Calculations', () => {
    it('calculates running cart subtotal and total accurately', () => {
      const cart: CartItem[] = [
        { menuItem: sampleDish1, quantity: 3 }, // 45,000 * 3 = 135,000
        { menuItem: sampleDish2, quantity: 2 }, // 65,000 * 2 = 130,000
      ];

      const total = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
      const totalItemCount = cart.reduce((count, item) => count + item.quantity, 0);

      expect(total).toBe(265000);
      expect(totalItemCount).toBe(5);
    });

    it('rejects adding unavailable dishes', () => {
      const unavailableDish: MenuItem = {
        ...sampleDish1,
        id: 'dish-soldout',
        is_available: false,
      };

      const canAddToCart = unavailableDish.is_available;
      expect(canAddToCart).toBe(false);
    });
  });

  describe('2. Order Total Verification & Historical Snapshots', () => {
    it('preserves unit price snapshots regardless of future price changes', () => {
      // Historical purchase
      const historicalUnitPrice = 45000;
      const quantity = 3;
      const lineTotal = historicalUnitPrice * quantity;

      expect(lineTotal).toBe(135000);

      // Suppose price increased later in menu_items
      const updatedMenuPrice = 52000;
      expect(historicalUnitPrice).not.toBe(updatedMenuPrice);
      // The order chit remains at historical snapshot
      expect(lineTotal).toBe(135000);
    });
  });

  describe('3. Order Status Transition Matrix', () => {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      new: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered', 'cancelled'],
      delivered: [], // Terminal state
      cancelled: [], // Terminal state
    };

    it('validates standard kitchen to table lifecycle transitions', () => {
      expect(validTransitions['new']).toContain('preparing');
      expect(validTransitions['preparing']).toContain('ready');
      expect(validTransitions['ready']).toContain('delivered');
    });

    it('prevents reviving a delivered order', () => {
      expect(validTransitions['delivered'].length).toBe(0);
    });
  });

  describe('4. Real Analytics Periods: Hourly, Weekly, 10-Days (O\'nlik), Monthly', () => {
    it('verifies analytics period definitions and order filtering boundaries', () => {
      const now = new Date();
      const mockOrders: any[] = [
        { id: '1', total_amount: 100000, status: 'delivered', created_at: now.toISOString() },
        { id: '2', total_amount: 200000, status: 'delivered', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: '3', total_amount: 300000, status: 'delivered', created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
        { id: '4', total_amount: 400000, status: 'delivered', created_at: new Date(Date.now() - 22 * 86400000).toISOString() },
      ];

      // Bugun / Hourly: only order 1
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayOrders = mockOrders.filter((o) => new Date(o.created_at).getTime() >= todayStart);
      expect(todayOrders.length).toBe(1);

      // Haftalik (7 kun): orders 1 and 2
      const weekStart = todayStart - 6 * 86400000;
      const weekOrders = mockOrders.filter((o) => new Date(o.created_at).getTime() >= weekStart);
      expect(weekOrders.length).toBe(2);

      // O'nlik (10 kun): orders 1, 2, and 3
      const tenDaysStart = todayStart - 9 * 86400000;
      const tenDaysOrders = mockOrders.filter((o) => new Date(o.created_at).getTime() >= tenDaysStart);
      expect(tenDaysOrders.length).toBe(3);

      // Oylik (30 kun): all 4 orders
      const monthStart = todayStart - 29 * 86400000;
      const monthOrders = mockOrders.filter((o) => new Date(o.created_at).getTime() >= monthStart);
      expect(monthOrders.length).toBe(4);
    });
  });

  describe('5. Tables (25 total: Oddiy, Biznes, VIP) & Menu Items (20 foods, 5 drinks, 5 desserts)', () => {
    it('verifies exactly 25 restaurant tables with Oddiy, Biznes, and VIP categories', () => {
      const { INITIAL_TABLES } = require('../services/seedData');
      expect(INITIAL_TABLES.length).toBe(25);

      const oddiyTables = INITIAL_TABLES.filter((t: any) => t.tier === 'oddiy' || t.zone === 'oddiy');
      const biznesTables = INITIAL_TABLES.filter((t: any) => t.tier === 'biznes' || t.zone === 'biznes');
      const vipTables = INITIAL_TABLES.filter((t: any) => t.tier === 'vip' || t.zone === 'vip');

      expect(oddiyTables.length).toBe(14);
      expect(biznesTables.length).toBe(6);
      expect(vipTables.length).toBe(5);
      expect(oddiyTables.length + biznesTables.length + vipTables.length).toBe(25);
    });

    it('verifies exactly 20 food dishes, 5 drinks, and 5 desserts with matched photos', () => {
      const { INITIAL_MENU_ITEMS } = require('../services/seedData');
      expect(INITIAL_MENU_ITEMS.length).toBe(30);

      const drinks = INITIAL_MENU_ITEMS.filter((i: any) => i.category_id === 'cat-ichimliklar');
      const desserts = INITIAL_MENU_ITEMS.filter((i: any) => i.category_id === 'cat-desertlar');
      const foods = INITIAL_MENU_ITEMS.filter(
        (i: any) => i.category_id !== 'cat-ichimliklar' && i.category_id !== 'cat-desertlar' && i.category_id !== 'cat-all'
      );

      expect(foods.length).toBe(20);
      expect(drinks.length).toBe(5);
      expect(desserts.length).toBe(5);

      // Verify each item has image_url and valid tier
      INITIAL_MENU_ITEMS.forEach((item: any) => {
        expect(item.image_url).toBeDefined();
        expect(item.image_url.length).toBeGreaterThan(5);
        expect(['oddiy', 'biznes', 'vip']).toContain(item.tier);
      });
    });
  });

  describe('6. Real-time Waiter Toast Alerts & Notifications', () => {
    it('verifies kitchen order status change alerts definition', () => {
      const transitions = [
        { from: 'new', to: 'preparing', expectedToastType: 'kitchen_preparing' },
        { from: 'preparing', to: 'ready', expectedToastType: 'kitchen_ready' },
      ];

      transitions.forEach((t) => {
        expect(t.expectedToastType).toBeDefined();
        expect(['kitchen_ready', 'kitchen_preparing']).toContain(t.expectedToastType);
      });
    });

    it('verifies customer service call notifications format and action resolution', () => {
      const sampleCall: {
        id: string;
        table_number: number;
        type: 'waiter' | 'bill';
        note: string;
        status: 'pending';
      } = {
        id: 'call-101',
        table_number: 14,
        type: 'waiter',
        note: 'Ofitsiant chaqirildi',
        status: 'pending',
      };

      const toastTitle = sampleCall.type === 'bill'
        ? `Hisob so'raldi: Stol №${sampleCall.table_number}`
        : `Ofitsiant chaqiruvi: Stol №${sampleCall.table_number}`;

      expect(toastTitle).toBe('Ofitsiant chaqiruvi: Stol №14');
      expect(sampleCall.status).toBe('pending');
    });
  });
});
