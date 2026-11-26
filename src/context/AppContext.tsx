import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Category,
  MenuItem,
  RestaurantTable,
  Order,
  CartItem,
  UserRole,
  UserProfile,
  ServiceCall,
  Waiter,
  WaiterShiftStatus,
  CustomerFeedback,
  DishReview,
  RestaurantRatingSummary,
  CustomerAccount,
  CashbackTransaction,
  CustomerSessionMode,
  StaffAccount,
  StaffAccountRole,
} from '../types';
import { dataService } from '../services/storage';
import {
  CASHBACK_RATE,
  customerAccountService,
} from '../services/customerAccount';
import { staffAccountService, STAFF_ROLE_LABELS } from '../services/staffAccount';
import { computeRestaurantLevel } from '../utils/restaurantLevel';
import { INITIAL_PROFILES } from '../services/seedData';
import { soundService } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  BellRing,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Receipt,
  Clock,
  ArrowRight,
  HandPlatter,
  Check,
} from 'lucide-react';

export interface ToastMessage {
  id: string;
  type:
    | 'success'
    | 'error'
    | 'info'
    | 'new_order'
    | 'kitchen_ready'
    | 'kitchen_preparing'
    | 'customer_call'
    | 'admin_escalation'
    | 'waiter_response';
  title: string;
  message?: string;
  tableNumber?: number;
  orderNumber?: string;
  orderId?: string;
  callId?: string;
  callCount?: number;
  waiterName?: string;
  totalAmount?: number;
  itemsCount?: number;
  actionLabel?: string;
  onAction?: () => void;
  timestamp?: number;
}

export interface ToastMeta {
  tableNumber?: number;
  orderNumber?: string;
  orderId?: string;
  callId?: string;
  callCount?: number;
  waiterName?: string;
  totalAmount?: number;
  itemsCount?: number;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export interface ResolvedCallStatus {
  tableNumber: number;
  waiterName?: string;
  resolvedAt: number;
}

interface AppContextType {
  // Auth & Roles
  userRole: UserRole;
  currentUser: UserProfile | null;
  setUserRole: (role: UserRole) => void;
  isDemoMode: boolean;

  // Active customer table
  activeTableNumber: number;
  setActiveTableNumber: (num: number) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, note?: string) => void;
  updateCartQuantity: (itemId: string, quantity: number, itemIndex?: number) => void;
  updateCartItemNote: (itemIndex: number, note: string) => void;
  removeFromCart: (itemId: string, itemIndex?: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;

  // Data
  categories: Category[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  orders: Order[];
  customerOrders: Order[];
  guestSessionId: string;
  serviceCalls: ServiceCall[];
  isLoading: boolean;

  // Sound & Browser Notifications
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  audioUnlocked: boolean;
  unlockAudio: (playTestChime?: boolean) => Promise<boolean>;

  // Actions
  refreshData: () => Promise<void>;
  placeOrder: (customerNote?: string, options?: { useCashbackAmount?: number }) => Promise<Order>;
  cancelCustomerOrder: (orderId: string) => Promise<{ ok: boolean; reason?: string }>;
  callWaiter: (note?: string) => Promise<void>;
  requestBill: () => Promise<void>;
  resolveServiceCall: (callId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  settleAndFreeTable: (tableNumber: number) => Promise<void>;

  // Customer Personal Cabinet & Cashback Loyalty
  customerAccount: CustomerAccount | null;
  allCustomerAccounts: CustomerAccount[];
  refreshCustomerAccounts: () => Promise<void>;
  customerTransactions: CashbackTransaction[];
  customerSessionMode: CustomerSessionMode;
  isCustomerAuthOpen: boolean;
  customerAuthInitialView: 'choice' | 'login' | 'register';
  openCustomerAuth: (view?: 'choice' | 'login' | 'register') => void;
  closeCustomerAuth: () => void;
  registerCustomerAccount: (fullName: string, phone: string, pin: string) => Promise<CustomerAccount>;
  loginCustomerAccount: (phone: string, pin: string) => Promise<CustomerAccount>;
  updateCustomerAccount: (params: {
    fullName: string;
    newPhone?: string;
    currentPin?: string;
    newPin?: string;
  }) => Promise<CustomerAccount>;
  continueAsGuest: () => void;
  endGuestSession: (showAuthModal?: boolean) => void;
  logoutCustomerAccount: () => void;

  // Staff Accounts (Admin, Waiter, Chef) — Create, Login & Edit
  staffAccounts: StaffAccount[];
  activeStaffAccount: StaffAccount | null;
  isStaffAccountsLoaded: boolean;
  isStaffAccountModalOpen: boolean;
  editingStaffAccount: StaffAccount | null;
  staffModalDefaultRole: StaffAccountRole;
  openStaffAccountModal: (account?: StaffAccount | null, defaultRole?: StaffAccountRole) => void;
  closeStaffAccountModal: () => void;
  registerStaffAccount: (params: {
    role: StaffAccountRole;
    fullName: string;
    phone: string;
    pin: string;
    badgeId?: string;
    assignedTables?: number[];
  }) => Promise<StaffAccount>;
  loginStaffAccount: (role: StaffAccountRole, phone: string, pin: string) => Promise<StaffAccount>;
  updateStaffAccount: (
    accountId: string,
    params: {
      fullName: string;
      role: StaffAccountRole;
      phone?: string;
      newPin?: string;
      badgeId?: string;
      status?: 'active' | 'inactive';
      assignedTables?: number[];
    }
  ) => Promise<StaffAccount>;
  deleteStaffAccount: (accountId: string) => Promise<void>;
  logoutStaffAccount: () => void;

  // Restaurant Info & Branding
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  restaurantBranch: string;
  setRestaurantBranch: (branch: string) => void;
  restaurantTagline: string;
  setRestaurantTagline: (tagline: string) => void;
  logoStyle: string;
  setLogoStyle: (style: string) => void;

  // Waiters (Ofitsiantlar)
  waiters: Waiter[];
  addWaiter: (waiter: Omit<Waiter, 'id' | 'created_at'>) => Promise<void>;
  updateWaiter: (waiter: Waiter) => Promise<void>;
  deleteWaiter: (id: string) => Promise<void>;
  updateWaiterStatus: (id: string, status: WaiterShiftStatus) => Promise<void>;

  // Customer Feedback, Dish Reviews & Live Restaurant Rating
  dishReviews: DishReview[];
  feedbacks: CustomerFeedback[];
  restaurantRating: RestaurantRatingSummary;
  getDishRating: (menuItemId: string) => { average: number; count: number };
  submitDishReview: (params: {
    menu_item_id: string;
    dish_name: string;
    rating: number;
    comment: string;
    customer_name?: string;
  }) => Promise<DishReview>;
  submitOrderFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'created_at'>) => Promise<void>;
  getFeedbackForOrder: (orderId: string) => Promise<CustomerFeedback | null>;

  // Toasts & Live Customer Waiter Call Indicator
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string, meta?: ToastMeta) => void;
  removeToast: (id: string) => void;
  simulateWaiterNotification: (type: 'new_order' | 'kitchen_ready' | 'customer_call') => void;
  lastResolvedCall: ResolvedCallStatus | null;
  dismissResolvedCall: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'dineflow_customer_cart_v1';
const TABLE_STORAGE_KEY = 'dineflow_active_table_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read table synchronously from scanned QR path (/t/5, /table/5) or query (?table=5)
  const getInitialTable = (): number => {
    if (typeof window !== 'undefined') {
      const pathMatch = window.location.pathname.match(/^\/(?:t|table)\/(\d+)/i);
      if (pathMatch && pathMatch[1]) {
        const parsedPathTable = Number(pathMatch[1]);
        if (!isNaN(parsedPathTable) && parsedPathTable > 0) {
          localStorage.setItem(TABLE_STORAGE_KEY, String(parsedPathTable));
          return parsedPathTable;
        }
      }
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable && !isNaN(Number(urlTable)) && Number(urlTable) > 0) {
        localStorage.setItem(TABLE_STORAGE_KEY, String(Number(urlTable)));
        return Number(urlTable);
      }
      const saved = localStorage.getItem(TABLE_STORAGE_KEY);
      if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
        return Number(saved);
      }
    }
    return 1;
  };

  const [activeTableNumber, setActiveTableNumberState] = useState<number>(getInitialTable);
  const [userRole, setUserRoleState] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_PROFILES[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [dishReviews, setDishReviews] = useState<DishReview[]>([]);
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(soundService.isEnabled());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastResolvedCall, setLastResolvedCall] = useState<ResolvedCallStatus | null>(null);

  // Customer Personal Cabinet & Cashback Loyalty State
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(() =>
    customerAccountService.getCachedActiveAccount()
  );
  const [allCustomerAccounts, setAllCustomerAccounts] = useState<CustomerAccount[]>(() =>
    customerAccountService.getCachedAllAccounts()
  );
  const [customerTransactions, setCustomerTransactions] = useState<CashbackTransaction[]>([]);
  const [customerSessionMode, setCustomerSessionMode] = useState<CustomerSessionMode>(() =>
    customerAccountService.getSavedSessionMode()
  );
  const [guestSessionId, setGuestSessionId] = useState<string>(() =>
    customerAccountService.getOrCreateGuestSessionId()
  );
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);
  const [customerAuthInitialView, setCustomerAuthInitialView] = useState<'choice' | 'login' | 'register'>('choice');

  const refreshCustomerAccounts = useCallback(async () => {
    const list = await customerAccountService.listAllAccounts();
    setAllCustomerAccounts(list);
  }, []);

  useEffect(() => {
    let active = true;
    customerAccountService.loadActiveAccount().then(({ account, transactions }) => {
      if (!active) return;
      if (account) {
        setCustomerAccount(account);
        setCustomerTransactions(transactions);
        setCustomerSessionMode('account');
      }
    });

    const unsubAccounts = customerAccountService.subscribeAllAccounts((list) => {
      if (!active) return;
      setAllCustomerAccounts(list);
    });

    return () => {
      active = false;
      unsubAccounts();
    };
  }, []);

  const openCustomerAuth = useCallback((view: 'choice' | 'login' | 'register' = 'choice') => {
    setCustomerAuthInitialView(view);
    setIsCustomerAuthOpen(true);
  }, []);

  const closeCustomerAuth = useCallback(() => {
    setIsCustomerAuthOpen(false);
  }, []);

  const registerCustomerAccount = useCallback(async (fullName: string, phone: string, pin: string) => {
    const { account, transactions } = await customerAccountService.registerAccount({
      fullName,
      phone,
      pin,
    });
    setCustomerAccount(account);
    setCustomerTransactions(transactions);
    setAllCustomerAccounts((prev) => [account, ...prev.filter((a) => a.id !== account.id)]);
    setCustomerSessionMode('account');
    setIsCustomerAuthOpen(false);
    soundService.playSuccess();
    return account;
  }, []);

  const loginCustomerAccount = useCallback(async (phone: string, pin: string) => {
    const { account, transactions } = await customerAccountService.loginAccount({
      phone,
      pin,
    });
    setCustomerAccount(account);
    setCustomerTransactions(transactions);
    setCustomerSessionMode('account');
    setIsCustomerAuthOpen(false);
    soundService.playSuccess();
    return account;
  }, []);

  const continueAsGuest = useCallback(() => {
    customerAccountService.setGuestSession();
    setCustomerAccount(null);
    setCustomerTransactions([]);
    setCustomerSessionMode('guest');
    setGuestSessionId(customerAccountService.getOrCreateGuestSessionId());
    setIsCustomerAuthOpen(false);
  }, []);

  const endGuestSession = useCallback((showAuthModal: boolean = true) => {
    const freshId = customerAccountService.resetGuestSessionId();
    setGuestSessionId(freshId);
    setCart([]);
    setCustomerSessionMode('undecided');
    soundService.playTick();
    if (showAuthModal) {
      setCustomerAuthInitialView('choice');
      setIsCustomerAuthOpen(true);
    }
  }, []);

  const logoutCustomerAccount = useCallback(() => {
    customerAccountService.clearSession();
    setCustomerAccount(null);
    setCustomerTransactions([]);
    setCustomerSessionMode('undecided');
    setGuestSessionId(customerAccountService.getOrCreateGuestSessionId());
    setCart([]);
    soundService.playTick();
  }, []);

  // Staff Accounts (Admin, Waiter, Chef) State
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() =>
    staffAccountService.getCachedStaffAccounts()
  );
  const [activeStaffAccount, setActiveStaffAccount] = useState<StaffAccount | null>(() =>
    staffAccountService.getActiveStaffAccount()
  );
  const [isStaffAccountsLoaded, setIsStaffAccountsLoaded] = useState<boolean>(false);
  const [isStaffAccountModalOpen, setIsStaffAccountModalOpen] = useState<boolean>(false);
  const [editingStaffAccount, setEditingStaffAccount] = useState<StaffAccount | null>(null);
  const [staffModalDefaultRole, setStaffModalDefaultRole] = useState<StaffAccountRole>('admin');

  useEffect(() => {
    let active = true;
    const applyStaffList = (list: StaffAccount[]) => {
      if (!active) return;
      setStaffAccounts(list);
      const current = staffAccountService.getActiveStaffAccount();
      if (current) {
        const refreshed = list.find((a) => a.id === current.id && a.status === 'active') || null;
        setActiveStaffAccount(refreshed);
        if (refreshed) {
          setUserRoleState(refreshed.role);
          setCurrentUser({
            id: refreshed.id,
            full_name: refreshed.full_name,
            role: refreshed.role,
            created_at: refreshed.created_at,
          });
        } else {
          staffAccountService.setActiveStaffAccountId(null);
        }
      }
    };

    staffAccountService
      .ensureSeeded()
      .then((list) => {
        applyStaffList(list);
      })
      .finally(() => {
        if (active) setIsStaffAccountsLoaded(true);
      });

    const unsubscribeStaff = staffAccountService.subscribeStaffAccounts((list) => {
      applyStaffList(list);
    });

    return () => {
      active = false;
      unsubscribeStaff();
    };
  }, []);

  const openStaffAccountModal = useCallback(
    (account: StaffAccount | null = null, defaultRole: StaffAccountRole = 'admin') => {
      setEditingStaffAccount(account);
      setStaffModalDefaultRole(account ? account.role : defaultRole);
      setIsStaffAccountModalOpen(true);
    },
    []
  );

  const closeStaffAccountModal = useCallback(() => {
    setIsStaffAccountModalOpen(false);
    setEditingStaffAccount(null);
  }, []);

  const registerStaffAccount = useCallback(
    async (params: {
      role: StaffAccountRole;
      fullName: string;
      phone: string;
      pin: string;
      badgeId?: string;
      assignedTables?: number[];
    }): Promise<StaffAccount> => {
      // Strictly enforce: ONLY Admin can assign tables to waiters
      const isAdminActor = activeStaffAccount?.role === 'admin';
      const safeParams = {
        ...params,
        assignedTables:
          params.role === 'waiter' && isAdminActor ? params.assignedTables || [] : [],
      };
      const created = await staffAccountService.registerStaffAccount(safeParams);
      setStaffAccounts((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
      soundService.playSuccess();
      return created;
    },
    [activeStaffAccount]
  );

  const loginStaffAccount = useCallback(
    async (role: StaffAccountRole, phone: string, pin: string): Promise<StaffAccount> => {
      const acc = await staffAccountService.loginStaffAccount({ role, phone, pin });
      setActiveStaffAccount(acc);
      setStaffAccounts((prev) => {
        const exists = prev.some((a) => a.id === acc.id);
        return exists ? prev.map((a) => (a.id === acc.id ? acc : a)) : [acc, ...prev];
      });
      setUserRoleState(acc.role);
      setCurrentUser({
        id: acc.id,
        full_name: acc.full_name,
        role: acc.role,
        created_at: acc.created_at,
      });
      soundService.playSuccess();
      return acc;
    },
    []
  );

  const updateStaffAccount = useCallback(
    async (
      accountId: string,
      params: {
        fullName: string;
        role: StaffAccountRole;
        phone?: string;
        newPin?: string;
        badgeId?: string;
        status?: 'active' | 'inactive';
        assignedTables?: number[];
      }
    ): Promise<StaffAccount> => {
      // Strictly enforce: ONLY Admin can modify assigned_tables, role, or account status
      const isAdminActor = activeStaffAccount?.role === 'admin';
      const existingAcc =
        staffAccounts.find((a) => a.id === accountId) ||
        staffAccountService.getCachedStaffAccounts().find((a) => a.id === accountId);

      const safeParams = isAdminActor
        ? params
        : {
            ...params,
            role: existingAcc?.role || params.role,
            status: existingAcc?.status || params.status,
            assignedTables: existingAcc?.assigned_tables || [],
          };

      const updated = await staffAccountService.updateStaffAccount(accountId, safeParams);
      setStaffAccounts((prev) => [
        updated,
        ...prev.filter((a) => a.id !== accountId && a.id !== updated.id),
      ]);
      setActiveStaffAccount((prev) => {
        if (prev && (prev.id === accountId || prev.id === updated.id)) {
          setCurrentUser({
            id: updated.id,
            full_name: updated.full_name,
            role: updated.role,
            created_at: updated.created_at,
          });
          return updated;
        }
        return prev;
      });
      soundService.playSuccess();
      return updated;
    },
    [activeStaffAccount, staffAccounts]
  );

  const deleteStaffAccount = useCallback(async (accountId: string): Promise<void> => {
    const existing = staffAccountService.getCachedStaffAccounts().find((a) => a.id === accountId);
    await staffAccountService.deleteStaffAccount(accountId);
    setStaffAccounts((prev) => prev.filter((a) => a.id !== accountId));
    setActiveStaffAccount((prev) => (prev?.id === accountId ? null : prev));
    if (existing) {
      soundService.playTick();
    }
  }, []);

  const logoutStaffAccount = useCallback(() => {
    staffAccountService.setActiveStaffAccountId(null);
    setActiveStaffAccount(null);
    soundService.playTick();
  }, []);

  const dismissResolvedCall = useCallback(() => {
    setLastResolvedCall(null);
  }, []);

  // Restaurant Branding Name, Branch, Tagline and Logo Style
  const RESTAURANT_NAME_KEY = 'dineflow_restaurant_name_v2';
  const RESTAURANT_BRANCH_KEY = 'dineflow_restaurant_branch_v2';
  const RESTAURANT_TAGLINE_KEY = 'dineflow_restaurant_tagline_v2';
  const RESTAURANT_LOGO_STYLE_KEY = 'dineflow_restaurant_logo_style_v2';

  const [restaurantName, setRestaurantNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(RESTAURANT_NAME_KEY) || 'Zafaran Grand';
    }
    return 'Zafaran Grand';
  });

  const [restaurantBranch, setRestaurantBranchState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(RESTAURANT_BRANCH_KEY) || 'Toshkent Markaziy filiali';
    }
    return 'Toshkent Markaziy filiali';
  });

  const [restaurantTagline, setRestaurantTaglineState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(RESTAURANT_TAGLINE_KEY) || 'Milliy & Zamonaviy Gastronomiya';
    }
    return 'Milliy & Zamonaviy Gastronomiya';
  });

  const [logoStyle, setLogoStyleState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(RESTAURANT_LOGO_STYLE_KEY) || 'crown';
    }
    return 'crown';
  });

  const setRestaurantName = useCallback((name: string) => {
    setRestaurantNameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RESTAURANT_NAME_KEY, name);
    }
  }, []);

  const setRestaurantBranch = useCallback((branch: string) => {
    setRestaurantBranchState(branch);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RESTAURANT_BRANCH_KEY, branch);
    }
  }, []);

  const setRestaurantTagline = useCallback((tagline: string) => {
    setRestaurantTaglineState(tagline);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RESTAURANT_TAGLINE_KEY, tagline);
    }
  }, []);

  const setLogoStyle = useCallback((style: string) => {
    setLogoStyleState(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RESTAURANT_LOGO_STYLE_KEY, style);
    }
  }, []);

  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const setActiveTableNumber = useCallback((num: number) => {
    setActiveTableNumberState(num);
    localStorage.setItem(TABLE_STORAGE_KEY, num.toString());
  }, []);

  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(() => soundService.isAudioUnlocked());

  useEffect(() => {
    return soundService.subscribeAudioState((unlocked) => {
      setAudioUnlocked(unlocked);
    });
  }, []);

  const unlockAudio = useCallback(async (playTestChime: boolean = false): Promise<boolean> => {
    const ok = await soundService.unlockAudio();
    setAudioUnlocked(ok);
    if (ok && playTestChime) {
      soundService.playNewOrderChime();
    }
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    } catch {
      // Ignore Notification permission errors
    }
    return ok;
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundService.setEnabled(enabled);
    setSoundEnabledState(enabled);
    if (enabled) {
      void soundService.unlockAudio().then((ok) => {
        setAudioUnlocked(ok);
        if (ok) soundService.playTick();
      });
    }
  }, []);

  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, message?: string, meta?: ToastMeta) => {
      // Strictly enforce: On Customer QR screens, ONLY waiter-related notifications are displayed
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isCustomerScreen =
          path.startsWith('/t/') ||
          path.startsWith('/table/') ||
          path.startsWith('/menu') ||
          path.startsWith('/cart') ||
          path.startsWith('/orders') ||
          path.startsWith('/account');
        if (isCustomerScreen && type !== 'waiter_response') {
          return;
        }
      }

      const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 6);
      const newToast: ToastMessage = {
        id,
        type,
        title,
        message,
        tableNumber: meta?.tableNumber,
        orderNumber: meta?.orderNumber,
        orderId: meta?.orderId,
        callId: meta?.callId,
        callCount: meta?.callCount,
        waiterName: meta?.waiterName,
        totalAmount: meta?.totalAmount,
        itemsCount: meta?.itemsCount,
        actionLabel: meta?.actionLabel,
        onAction: meta?.onAction,
        timestamp: Date.now(),
      };
      setToasts((prev) => [newToast, ...prev.filter((t) => t.id !== id)].slice(0, 5));
      const autoDismissMs =
        meta?.duration ||
        (type === 'admin_escalation'
          ? 16000
          : type === 'new_order'
          ? 12000
          : type === 'kitchen_ready'
          ? 10000
          : type === 'customer_call'
          ? 12000
          : type === 'waiter_response'
          ? 7000
          : 4500);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, autoDismissMs);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    setUserRoleState(role);
    const profile = INITIAL_PROFILES.find((p) => p.role === role) || INITIAL_PROFILES[0];
    setCurrentUser(role === 'customer' ? null : profile);
    soundService.playTick();
  }, []);

  // Tracking refs to avoid duplicate notifications
  const handledTransitionsRef = React.useRef<Set<string>>(new Set());
  const handledCallsRef = React.useRef<Set<string>>(new Set());
  const handledNewOrdersRef = React.useRef<Set<string>>(new Set());
  const handledResolvedCallsRef = React.useRef<Set<string>>(new Set());
  const prevOrdersRef = React.useRef<Map<string, Order['status']>>(new Map());
  const prevPendingCallsRef = React.useRef<Map<string, ServiceCall>>(new Map());
  const isFirstSyncRef = React.useRef<boolean>(true);
  const activeTableNumberRef = React.useRef<number>(activeTableNumber);
  const activeStaffAccountRef = React.useRef<StaffAccount | null>(activeStaffAccount);

  useEffect(() => {
    activeTableNumberRef.current = activeTableNumber;
  }, [activeTableNumber]);

  useEffect(() => {
    activeStaffAccountRef.current = activeStaffAccount;
  }, [activeStaffAccount]);

  const isTableAssignedToWaiter = (tableNumber: number): boolean => {
    const staff = activeStaffAccountRef.current;
    if (!staff || staff.role !== 'waiter') return false;
    return Array.isArray(staff.assigned_tables) && staff.assigned_tables.includes(tableNumber);
  };

  // Helper to check which screen the user is currently viewing
  const getScreenContext = (): 'customer' | 'waiter' | 'admin' | 'kitchen' | 'auth' => {
    if (typeof window === 'undefined') return 'customer';
    const path = window.location.pathname;
    if (path === '/' || path.startsWith('/login')) return 'auth';
    if (path.startsWith('/waiter')) return 'waiter';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/kitchen')) return 'kitchen';
    return 'customer';
  };

  // Trigger NEW ORDER alert — STRICTLY ONLY on Waiter screen (/waiter) for assigned tables
  const notifyNewOrder = useCallback(
    (order: {
      id: string;
      order_number?: string;
      table_number: number;
      total_amount?: number;
      items_count?: number;
    }) => {
      const screen = getScreenContext();
      if (screen !== 'waiter') return;
      if (!isTableAssignedToWaiter(order.table_number)) return;

      const key = `${order.id}_created`;
      if (handledNewOrdersRef.current.has(key)) return;
      handledNewOrdersRef.current.add(key);

      soundService.playNewOrderChime();
      const ordNum = order.order_number || 'Yangi buyurtma';
      const itemsText = order.items_count ? `${order.items_count} xil taom` : 'Yangi taomlar';
      const totalText = order.total_amount
        ? ` · ${order.total_amount.toLocaleString('uz-UZ')} so'm`
        : '';

      // Fire native browser/OS notification when permission is granted (works even when tab is in background)
      try {
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification(`🔔 Yangi buyurtma: Stol №${order.table_number}`, {
            body: `${ordNum} (${itemsText}${totalText}) — qabul qilish kutilmoqda`,
            tag: `dineflow-order-${order.id}`,
          });
        }
      } catch {
        // Ignore OS notification errors
      }

      addToast(
        'new_order',
        `Yangi buyurtma: Stol №${order.table_number}`,
        `${ordNum} (${itemsText}${totalText}) mijoz tomonidan yuborildi!`,
        {
          tableNumber: order.table_number,
          orderNumber: ordNum,
          orderId: order.id,
          totalAmount: order.total_amount,
          itemsCount: order.items_count,
          actionLabel: 'Qabul qilish (✓✓)',
          onAction: async () => {
            await dataService.updateOrderStatus(order.id, 'preparing');
            addToast('success', 'Qabul qilindi', `${ordNum} oshxonaga uzatildi.`);
            refreshData();
          },
          duration: 16000,
        }
      );
    },
    [addToast]
  );

  // Trigger WAITER ACCEPTED CALL alert — STRICTLY ONLY on Customer screen for their active table
  const notifyWaiterAcceptedCall = useCallback(
    (info: { callId: string; tableNumber?: number; waiterName?: string }) => {
      const screen = getScreenContext();
      if (screen !== 'customer') return;
      if (!info.tableNumber || info.tableNumber !== activeTableNumberRef.current) return;

      const key = `${info.callId}_resolved`;
      if (handledResolvedCallsRef.current.has(key)) return;
      handledResolvedCallsRef.current.add(key);

      soundService.playSuccess();
      setLastResolvedCall({
        tableNumber: info.tableNumber,
        waiterName: info.waiterName,
        resolvedAt: Date.now(),
      });

      addToast(
        'waiter_response',
        'Ofitsiant chaqiruvingizni qabul qildi!',
        `${info.waiterName || 'Mas\'ul ofitsiant'} hozir Stol №${info.tableNumber} ga kelmoqda.`,
        {
          tableNumber: info.tableNumber,
          waiterName: info.waiterName,
          duration: 8000,
        }
      );
    },
    [addToast]
  );

  // Trigger kitchen ready alert (Waiter for assigned tables & Admin only)
  const notifyKitchenReady = useCallback(
    (order: { id: string; order_number?: string; table_number: number }) => {
      const screen = getScreenContext();
      if (screen !== 'waiter' && screen !== 'admin') return;
      if (screen === 'waiter' && !isTableAssignedToWaiter(order.table_number)) return;

      const key = `${order.id}_ready`;
      if (handledTransitionsRef.current.has(key)) return;
      handledTransitionsRef.current.add(key);

      soundService.playFoodReadyBell();
      const ordNum = order.order_number || 'Buyurtma';
      addToast(
        'kitchen_ready',
        `Taom tayyor: Stol №${order.table_number}`,
        `${ordNum} — Oshxonadan olib, mijoz stoliga eltish lozim!`,
        {
          tableNumber: order.table_number,
          orderNumber: ordNum,
          orderId: order.id,
          actionLabel: 'Yetkazildi',
          onAction: async () => {
            await dataService.updateOrderStatus(order.id, 'delivered');
            addToast('success', 'Yetkazildi', `${ordNum} mijozga yetkazildi deb belgilandi.`);
            refreshData();
          },
          duration: 10000,
        }
      );
    },
    [addToast]
  );

  // Trigger kitchen preparing alert (Waiter only, assigned tables)
  const notifyKitchenPreparing = useCallback(
    (order: { id: string; order_number?: string; table_number: number }) => {
      const screen = getScreenContext();
      if (screen !== 'waiter') return;
      if (!isTableAssignedToWaiter(order.table_number)) return;

      const key = `${order.id}_preparing`;
      if (handledTransitionsRef.current.has(key)) return;
      handledTransitionsRef.current.add(key);

      const ordNum = order.order_number || 'Buyurtma';
      addToast(
        'kitchen_preparing',
        `Oshxona boshladi: Stol №${order.table_number}`,
        `${ordNum} oshpazlar tomonidan tayyorlanmoqda...`,
        {
          tableNumber: order.table_number,
          orderNumber: ordNum,
          orderId: order.id,
          duration: 6000,
        }
      );
    },
    [addToast]
  );

  // Trigger customer call alert:
  // - 1st & 2nd calls: ONLY notifies Waiter screen (/waiter)
  // - 3rd+ call (escalated_to_admin): notifies Waiter AND escalates to Admin (/admin)
  const notifyCustomerCall = useCallback(
    (call: {
      id: string;
      table_number: number;
      type?: 'waiter' | 'bill' | 'water';
      note?: string;
      call_count?: number;
      escalated_to_admin?: boolean;
      assigned_waiter_name?: string;
    }) => {
      const screen = getScreenContext();
      // Never show staff call popups on Customer, Kitchen, or Login screens
      if (screen !== 'waiter' && screen !== 'admin') return;
      if (screen === 'waiter' && !isTableAssignedToWaiter(call.table_number)) return;

      const count = call.call_count || 1;
      const isEscalated = Boolean(call.escalated_to_admin || count >= 3);
      const dedupeKey = `${call.id}_c${count}_${screen}`;
      if (handledCallsRef.current.has(dedupeKey)) return;
      handledCallsRef.current.add(dedupeKey);

      const isBill = call.type === 'bill';

      // On Admin screen: ONLY notify after 2 calls (on the 3rd+ call)
      if (screen === 'admin') {
        if (!isEscalated) {
          return; // 1st & 2nd calls go ONLY to Waiter!
        }
        soundService.playWaiterAlert();
        addToast(
          'admin_escalation',
          `Ofitsiant kelmadi! Stol №${call.table_number} (${count}-marta chaqiruv)`,
          `Mas'ul: ${call.assigned_waiter_name || 'Zal ofitsianti'} javob bermadi. ${call.note || 'Mijoz kutib qoldi!'}`,
          {
            tableNumber: call.table_number,
            callId: call.id,
            callCount: count,
            waiterName: call.assigned_waiter_name,
            actionLabel: 'Nazoratga olindi (Yopish)',
            onAction: async () => {
              await dataService.resolveServiceCall(call.id);
              addToast('success', 'Hal etildi', `Stol №${call.table_number} chaqiruvi admin tomonidan yopildi.`);
              refreshData();
            },
            duration: 16000,
          }
        );
        return;
      }

      // On Waiter screen (/waiter): Always notify on 1st, 2nd, and 3rd+ calls
      soundService.playWaiterAlert();
      addToast(
        'customer_call',
        isEscalated
          ? `SHOSHILINCH (${count}-marta): Stol №${call.table_number}`
          : count === 2
          ? `Qayta chaqiruv (2-marta): Stol №${call.table_number}`
          : isBill
          ? `Hisob so'raldi: Stol №${call.table_number}`
          : `Ofitsiant chaqiruvi: Stol №${call.table_number}`,
        isEscalated
          ? `Mijoz ${count}-marta chaqirmoqda! Kechikish haqida Adminga ham xabar yuborildi!`
          : count === 2
          ? `Mijoz 2-marta chaqirmoqda. 3-chaqiruvda Adminga xabar yuboriladi!`
          : call.note ||
              (isBill
                ? `Stol №${call.table_number} to'lov hisob varaqasini so'radi.`
                : `Stol №${call.table_number} da mijoz sizni kutmoqda.`),
        {
          tableNumber: call.table_number,
          callId: call.id,
          callCount: count,
          waiterName: call.assigned_waiter_name,
          actionLabel: 'Qabul qilindi',
          onAction: async () => {
            await dataService.resolveServiceCall(call.id);
            addToast('success', 'Qabul qilindi', `Stol №${call.table_number} chaqiruvi bajarildi.`);
            refreshData();
          },
          duration: 12000,
        }
      );
    },
    [addToast]
  );

  // Test simulation for waiters (strictly uses assigned tables)
  const simulateWaiterNotification = useCallback(
    (type: 'new_order' | 'kitchen_ready' | 'customer_call') => {
      void soundService.unlockAudio();
      const assigned = activeStaffAccountRef.current?.assigned_tables || [];
      if (assigned.length === 0) {
        addToast(
          'info',
          'Stol biriktirilmagan',
          "Sinov bildirishnomasi uchun avval Administrator sizga kamida bitta stol biriktirishi kerak."
        );
        return;
      }
      const randomTable = assigned[Math.floor(Math.random() * assigned.length)];
      if (type === 'new_order') {
        notifyNewOrder({
          id: 'test-new-order-' + Date.now(),
          order_number: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
          table_number: randomTable,
          total_amount: 145000,
          items_count: 3,
        });
      } else if (type === 'kitchen_ready') {
        notifyKitchenReady({
          id: 'test-order-' + Date.now(),
          order_number: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
          table_number: randomTable,
        });
      } else {
        notifyCustomerCall({
          id: 'test-call-' + Date.now(),
          table_number: randomTable,
          type: Math.random() > 0.5 ? 'waiter' : 'bill',
          note: `Stol №${randomTable} da mijoz ofitsiantni kutmoqda`,
        });
      }
    },
    [addToast, notifyNewOrder, notifyKitchenReady, notifyCustomerCall]
  );

  // Fetch all live data
  const refreshData = useCallback(async () => {
    try {
      const [cats, items, tbls, ords, calls, wtrs, revs, fbs] = await Promise.all([
        dataService.getCategories(),
        dataService.getMenuItems(),
        dataService.getTables(),
        dataService.getOrders(),
        dataService.getServiceCalls(),
        dataService.getWaiters(),
        dataService.getDishReviews(),
        dataService.getFeedbacks(),
      ]);

      // Check state diffs for real-time alerts
      if (isFirstSyncRef.current) {
        isFirstSyncRef.current = false;
        const screen = getScreenContext();
        ords.forEach((o) => {
          prevOrdersRef.current.set(o.id, o.status);
          handledNewOrdersRef.current.add(`${o.id}_created`);
        });
        calls.forEach((c) => {
          if (c.status === 'pending') {
            handledCallsRef.current.add(`${c.id}_c${c.call_count || 1}_${screen}`);
            prevPendingCallsRef.current.set(c.id, c);
          }
        });
      } else {
        // Detect brand new orders (notify ONLY Waiter screen) & status transitions
        const nowMs = Date.now();
        ords.forEach((o) => {
          const prevStatus = prevOrdersRef.current.get(o.id);
          if (!prevStatus && o.status === 'new') {
            const createdMs = new Date(o.created_at).getTime();
            const isRecentOrder = !Number.isNaN(createdMs) && nowMs - createdMs < 10 * 60 * 1000;
            if (isRecentOrder) {
              notifyNewOrder({
                id: o.id,
                order_number: o.order_number,
                table_number: o.table_number,
                total_amount: o.total_amount,
                items_count: o.items?.length,
              });
            }
          } else if (prevStatus && prevStatus !== o.status) {
            if (o.status === 'ready') {
              notifyKitchenReady(o);
            } else if (o.status === 'preparing') {
              notifyKitchenPreparing(o);
            }
          }
          prevOrdersRef.current.set(o.id, o.status);
        });

        // Detect new/escalated pending customer calls & newly resolved calls
        const screen = getScreenContext();
        calls.forEach((c) => {
          const key = `${c.id}_c${c.call_count || 1}_${screen}`;
          if (c.status === 'pending') {
            if (!handledCallsRef.current.has(key)) {
              notifyCustomerCall(c);
            }
            prevPendingCallsRef.current.set(c.id, c);
          } else if (c.status === 'resolved' && prevPendingCallsRef.current.has(c.id)) {
            const prevCall = prevPendingCallsRef.current.get(c.id);
            prevPendingCallsRef.current.delete(c.id);
            notifyWaiterAcceptedCall({
              callId: c.id,
              tableNumber: c.table_number,
              waiterName: c.assigned_waiter_name || prevCall?.assigned_waiter_name,
            });
          }
        });
      }

      setCategories(cats);
      setMenuItems(items);
      setTables(tbls);
      setOrders(ords);
      setServiceCalls(calls);
      setWaiters(wtrs);
      setDishReviews(revs);
      setFeedbacks(fbs);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    notifyNewOrder,
    notifyKitchenReady,
    notifyKitchenPreparing,
    notifyCustomerCall,
    notifyWaiterAcceptedCall,
  ]);

  // Initial load & real-time sync listeners
  useEffect(() => {
    refreshData();

    const handleRealtimePayload = (detail: any) => {
      if (!detail || !detail.action) return;

      if (detail.action === 'order_created' && detail.orderId) {
        notifyNewOrder({
          id: detail.orderId,
          order_number: detail.orderNumber,
          table_number: detail.tableNumber || 1,
          total_amount: detail.totalAmount,
          items_count: detail.itemsCount,
        });
      } else if (detail.action === 'order_status_changed' && detail.newStatus) {
        if (detail.newStatus === 'ready' && detail.orderId) {
          notifyKitchenReady({
            id: detail.orderId,
            order_number: detail.orderNumber,
            table_number: detail.tableNumber || 1,
          });
        } else if (detail.newStatus === 'preparing' && detail.orderId) {
          notifyKitchenPreparing({
            id: detail.orderId,
            order_number: detail.orderNumber,
            table_number: detail.tableNumber || 1,
          });
        }
      } else if (detail.action === 'service_call_created' && detail.callId) {
        notifyCustomerCall({
          id: detail.callId,
          table_number: detail.tableNumber || 1,
          type: detail.serviceType || 'waiter',
          note: detail.serviceNote,
          call_count: detail.callCount || 1,
          escalated_to_admin: detail.escalatedToAdmin,
          assigned_waiter_name: detail.assignedWaiterName,
        });
      } else if (detail.action === 'service_call_resolved' && detail.callId) {
        notifyWaiterAcceptedCall({
          callId: detail.callId,
          tableNumber: detail.tableNumber,
          waiterName: detail.assignedWaiterName,
        });
      }
    };

    // Listen to local window events
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleRealtimePayload(customEvent?.detail);
      refreshData();
    };
    window.addEventListener('dineflow:sync', handleSync);

    // Listen to cross-tab BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('dineflow_realtime_channel');
        bc.onmessage = (event) => {
          handleRealtimePayload(event?.data);
          refreshData();
        };
      }
    } catch {
      // Ignore
    }

    // Cross-tab localStorage event fallback (works even if BroadcastChannel is unavailable)
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('dineflow_')) {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Fast polling fallback every 3 seconds for real-time cross-device sync
    const timer = setInterval(() => {
      refreshData();
    }, 3000);

    return () => {
      window.removeEventListener('dineflow:sync', handleSync);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      clearInterval(timer);
    };
  }, [
    refreshData,
    notifyNewOrder,
    notifyKitchenReady,
    notifyKitchenPreparing,
    notifyCustomerCall,
    notifyWaiterAcceptedCall,
  ]);

  // Save cart changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Cart operations (Instant, no popup toast spam on every +/- tap)
  const addToCart = useCallback((item: MenuItem, quantity: number = 1, note?: string) => {
    if (!item.is_available) {
      addToast('error', 'Taom tugagan', `"${item.name}" hozirda mavjud emas.`);
      return;
    }
    soundService.playTick();
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.menuItem.id === item.id && (ci.item_note || '') === (note || '')
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + quantity,
        };
        return copy;
      }
      return [...prev, { menuItem: item, quantity, item_note: note }];
    });
  }, [addToast]);

  const updateCartQuantity = useCallback(
    (itemId: string, quantity: number, itemIndex?: number) => {
      soundService.playTick();
      setCart((prev) => {
        if (itemIndex !== undefined && itemIndex >= 0 && itemIndex < prev.length) {
          if (quantity <= 0) {
            return prev.filter((_, idx) => idx !== itemIndex);
          }
          return prev.map((ci, idx) => (idx === itemIndex ? { ...ci, quantity } : ci));
        }
        if (quantity <= 0) {
          return prev.filter((ci) => ci.menuItem.id !== itemId);
        }
        // Update last matching row when decrementing/incrementing from MenuPage card
        let updatedOne = false;
        const result: CartItem[] = [];
        for (let i = prev.length - 1; i >= 0; i--) {
          const ci = prev[i];
          if (!updatedOne && ci.menuItem.id === itemId) {
            updatedOne = true;
            const otherQty = prev.reduce(
              (acc, x, idx) => (idx !== i && x.menuItem.id === itemId ? acc + x.quantity : acc),
              0
            );
            const targetRowQty = quantity - otherQty;
            if (targetRowQty > 0) {
              result.unshift({ ...ci, quantity: targetRowQty });
            }
          } else {
            result.unshift(ci);
          }
        }
        return result;
      });
    },
    []
  );

  const updateCartItemNote = useCallback((itemIndex: number, note: string) => {
    const cleanNote = note.slice(0, 160);
    setCart((prev) =>
      prev.map((ci, idx) =>
        idx === itemIndex ? { ...ci, item_note: cleanNote } : ci
      )
    );
  }, []);

  const removeFromCart = useCallback((itemId: string, itemIndex?: number) => {
    soundService.playTick();
    setCart((prev) => {
      if (itemIndex !== undefined && itemIndex >= 0 && itemIndex < prev.length) {
        return prev.filter((_, idx) => idx !== itemIndex);
      }
      return prev.filter((ci) => ci.menuItem.id !== itemId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.menuItem.price * it.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  // Instant Order Placement (< 5ms) with optional Cashback redemption (2% cashback is credited ONLY upon delivery)
  const placeOrder = useCallback(
    async (customerNote?: string, options?: { useCashbackAmount?: number }): Promise<Order> => {
      if (cart.length === 0) {
        throw new Error("Savatingiz bo'sh");
      }
      try {
        const subtotal = cart.reduce((acc, it) => acc + it.menuItem.price * it.quantity, 0);
        const requestedCashback = options?.useCashbackAmount || 0;
        const safeCashbackUsed = customerAccount
          ? Math.min(customerAccount.cashback_balance, subtotal, Math.max(0, Math.round(requestedCashback)))
          : 0;
        const payableAmount = Math.max(0, subtotal - safeCashbackUsed);
        const expectedCashbackEarned = customerAccount
          ? Math.round(payableAmount * CASHBACK_RATE)
          : 0;

        const order = await dataService.createOrder({
          tableNumber: activeTableNumber,
          cartItems: cart,
          customerNote,
          cashbackUsed: safeCashbackUsed,
          cashbackEarned: expectedCashbackEarned,
          customerAccountId: customerAccount?.id,
          guestSessionId: customerAccount ? undefined : guestSessionId,
          customerName: customerAccount?.full_name,
        });

        // Deduct ONLY spent cashback at order creation; 2% cashback is credited strictly when status === 'delivered'
        if (customerAccount) {
          const loyaltyResult = await customerAccountService.reserveOrderCashbackUsage(customerAccount, {
            orderId: order.id,
            orderNumber: order.order_number,
            subtotalAmount: order.subtotal_amount ?? subtotal,
            cashbackUsed: safeCashbackUsed,
          });
          setCustomerAccount(loyaltyResult.account);
          setCustomerTransactions(loyaltyResult.transactions);
        }

        // Immediately update local React state without waiting for network poll
        setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
        clearCart();

        // NOTE: Do NOT show an order toast on the customer screen.
        // New order notification is dispatched strictly to the Waiter screen (/waiter).
        refreshData();
        return order;
      } catch (err: unknown) {
        throw err;
      }
    },
    [cart, activeTableNumber, customerAccount, guestSessionId, clearCart, refreshData]
  );

  // Scoped customer order history:
  // - Logged-in account: FULL permanent order history belonging strictly to this account across visits & tables
  // - Guest mode: ONLY current session's unsettled orders at this table (disappears on bill settlement or exit/re-entry)
  const customerOrders = useMemo(() => {
    if (customerAccount) {
      return orders
        .filter((o) => o.customer_account_id === customerAccount.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (!guestSessionId) return [];
    return orders
      .filter(
        (o) =>
          !o.is_settled &&
          !o.customer_account_id &&
          o.table_number === activeTableNumber &&
          o.guest_session_id === guestSessionId
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, customerAccount, activeTableNumber, guestSessionId]);

  // Automatically clear guest history & rotate guest session once Waiter/Admin settles their check
  useEffect(() => {
    if (customerAccount || !guestSessionId) return;
    const myGuestOrders = orders.filter((o) => o.guest_session_id === guestSessionId);
    if (myGuestOrders.length > 0 && myGuestOrders.every((o) => Boolean(o.is_settled))) {
      const freshId = customerAccountService.resetGuestSessionId();
      setGuestSessionId(freshId);
      setCart([]);
    }
  }, [orders, customerAccount, guestSessionId]);

  // Cancel order strictly while it has 1 tick (status === 'new') before waiter acceptance
  // Cancelled orders NEVER earn cashback; any spent cashback is refunded.
  const cancelCustomerOrder = useCallback(
    async (orderId: string): Promise<{ ok: boolean; reason?: string }> => {
      const result = await dataService.cancelOrder(orderId);
      if (!result.ok || !result.order) {
        return { ok: false, reason: result.reason || 'already_accepted' };
      }

      const cancelledOrder = result.order;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'cancelled', cashback_earned: 0, updated_at: cancelledOrder.updated_at }
            : o
        )
      );

      if (customerAccount && cancelledOrder.customer_account_id === customerAccount.id) {
        const refunded = await customerAccountService.refundCancelledOrderCashback(customerAccount, {
          orderId: cancelledOrder.id,
          orderNumber: cancelledOrder.order_number,
          cashbackUsed: cancelledOrder.cashback_used || 0,
        });
        setCustomerAccount(refunded.account);
        setCustomerTransactions(refunded.transactions);
      }

      refreshData();
      return { ok: true };
    },
    [customerAccount, refreshData]
  );

  // Idempotent cross-device Cashback Reconciliation:
  // - Credits 2% cashback ONLY when an order reaches 'delivered'
  // - Refunds spent cashback (with ZERO earned cashback) if staff/customer cancels an order
  const reconciledCashbackKeysRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!customerAccount || orders.length === 0) return;

    const myOrders = orders.filter((o) => o.customer_account_id === customerAccount.id);
    if (myOrders.length === 0) return;

    let cancelled = false;
    (async () => {
      let latestAccount = customerAccount;
      let latestTransactions = customerTransactions;
      let didUpdate = false;

      for (const ord of myOrders) {
        if (ord.status === 'delivered') {
          const earnKey = `earn:${latestAccount.id}:${ord.id}`;
          if (reconciledCashbackKeysRef.current.has(earnKey)) continue;
          reconciledCashbackKeysRef.current.add(earnKey);

          const res = await customerAccountService.creditDeliveredOrderCashback(latestAccount, {
            orderId: ord.id,
            orderNumber: ord.order_number,
            payableAmount: ord.total_amount,
          });
          if (res.creditedAmount > 0) {
            latestAccount = res.account;
            latestTransactions = res.transactions;
            didUpdate = true;
          }
        } else if (ord.status === 'cancelled' && (ord.cashback_used || 0) > 0) {
          const refundKey = `refund:${latestAccount.id}:${ord.id}`;
          if (reconciledCashbackKeysRef.current.has(refundKey)) continue;
          reconciledCashbackKeysRef.current.add(refundKey);

          const res = await customerAccountService.refundCancelledOrderCashback(latestAccount, {
            orderId: ord.id,
            orderNumber: ord.order_number,
            cashbackUsed: ord.cashback_used || 0,
          });
          if (res.refundedAmount > 0) {
            latestAccount = res.account;
            latestTransactions = res.transactions;
            didUpdate = true;
          }
        }
      }

      if (!cancelled && didUpdate) {
        setCustomerAccount(latestAccount);
        setCustomerTransactions(latestTransactions);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerAccount?.id, orders]);

  const updateCustomerAccount = useCallback(
    async (params: {
      fullName: string;
      newPhone?: string;
      currentPin?: string;
      newPin?: string;
    }): Promise<CustomerAccount> => {
      if (!customerAccount) {
        throw new Error("Tahrirlash uchun avval shaxsiy kabinetingizga kiring.");
      }
      const { account, transactions } = await customerAccountService.updateAccount(customerAccount, params);
      setCustomerAccount(account);
      setCustomerTransactions(transactions);
      setAllCustomerAccounts((prev) => [
        account,
        ...prev.filter((a) => a.id !== account.id && a.id !== customerAccount.id),
      ]);
      soundService.playSuccess();
      refreshData();
      return account;
    },
    [customerAccount, refreshData]
  );

  // Table Service Actions (Waiter notifications — allowed on Customer screen)
  const callWaiter = useCallback(async (note?: string) => {
    try {
      setLastResolvedCall(null);
      const call = await dataService.requestService(activeTableNumber, 'waiter', note);
      const count = call.call_count || 1;
      if (count >= 3 || call.escalated_to_admin) {
        addToast(
          'waiter_response',
          `Ofitsiant qayta chaqirildi (${count}-marta)`,
          `Ofitsiant kelmagani sababli Bosh administratorga ham xabar yuborildi.`,
          {
            tableNumber: activeTableNumber,
            callCount: count,
            waiterName: call.assigned_waiter_name,
          }
        );
      } else if (count === 2) {
        addToast(
          'waiter_response',
          'Ofitsiant qayta chaqirildi (2-marta)',
          `${call.assigned_waiter_name || 'Ofitsiant'} ekraniga qayta xabar yuborildi. 3-chaqiruvda administratorga xabar boradi.`,
          {
            tableNumber: activeTableNumber,
            callCount: count,
            waiterName: call.assigned_waiter_name,
          }
        );
      } else {
        addToast(
          'waiter_response',
          'Ofitsiant chaqirildi',
          `${call.assigned_waiter_name || 'Ofitsiant'} ekraniga real vaqtda xabar yuborildi.`,
          {
            tableNumber: activeTableNumber,
            callCount: count,
            waiterName: call.assigned_waiter_name,
          }
        );
      }
      await refreshData();
    } catch {
      // Silent fallback
    }
  }, [activeTableNumber, addToast, refreshData]);

  const requestBill = useCallback(async () => {
    try {
      setLastResolvedCall(null);
      const call = await dataService.requestService(activeTableNumber, 'bill');
      addToast(
        'waiter_response',
        "Ofitsiantga hisob so'rovi yuborildi",
        `Stol №${activeTableNumber} hisob varaqasi uchun ofitsiant kelmoqda.`,
        {
          tableNumber: activeTableNumber,
          waiterName: call.assigned_waiter_name,
        }
      );
      await refreshData();
    } catch {
      // Silent fallback
    }
  }, [activeTableNumber, addToast, refreshData]);

  const resolveServiceCall = useCallback(async (callId: string) => {
    await dataService.resolveServiceCall(callId);
    addToast('success', 'Bajarildi', 'Xizmat chaqiruvi ko\'rib chiqildi');
    await refreshData();
  }, [addToast, refreshData]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    await dataService.updateOrderStatus(orderId, status);
    addToast('info', 'Holat o\'zgardi', `Buyurtma yangilandi`);
    await refreshData();
  }, [addToast, refreshData]);

  const settleAndFreeTable = useCallback(async (tableNumber: number) => {
    try {
      await dataService.settleAndFreeTable(tableNumber);
      addToast(
        'success',
        `Stol №${tableNumber} bo'shatildi`,
        `Hisob yopildi va stol yangi mijozlar qabuliga tayyor.`
      );
      await refreshData();
    } catch {
      addToast('error', 'Xatolik', 'Stolni bo\'shatishda xatolik yuz berdi');
    }
  }, [addToast, refreshData]);

  const addWaiter = useCallback(
    async (waiterData: Omit<Waiter, 'id' | 'created_at'>) => {
      const newWaiter: Waiter = {
        ...waiterData,
        id: 'waiter-' + Date.now() + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
      };
      await dataService.saveWaiter(newWaiter);
      setWaiters((prev) => [newWaiter, ...prev]);
      addToast(
        'success',
        "Ofitsiant qo'shildi",
        `${newWaiter.full_name} (${newWaiter.badge_id}) muvaffaqiyatli saqlandi.`
      );
    },
    [addToast]
  );

  const updateWaiter = useCallback(
    async (waiter: Waiter) => {
      await dataService.saveWaiter(waiter);
      setWaiters((prev) => prev.map((w) => (w.id === waiter.id ? waiter : w)));
      addToast('success', "Ma'lumotlar yangilandi", `${waiter.full_name} ma'lumotlari saqlandi.`);
    },
    [addToast]
  );

  const deleteWaiter = useCallback(
    async (id: string) => {
      const existing = waiters.find((w) => w.id === id);
      await dataService.deleteWaiter(id);
      setWaiters((prev) => prev.filter((w) => w.id !== id));
      addToast(
        'info',
        "Ofitsiant o'chirildi",
        `${existing?.full_name || 'Xodim'} (${existing?.badge_id || id}) tizimdan o'chirildi.`
      );
    },
    [waiters, addToast]
  );

  const updateWaiterStatus = useCallback(
    async (id: string, status: WaiterShiftStatus) => {
      await dataService.updateWaiterStatus(id, status);
      setWaiters((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status, updated_at: new Date().toISOString() } : w
        )
      );
      const statusLabels: Record<WaiterShiftStatus, string> = {
        active: 'Faol smenada',
        break: 'Tanaffusda',
        vacation: "Ta'tilda",
        inactive: 'Nofaol',
      };
      addToast('success', "Smena holati o'zgardi", `Yangi holat: ${statusLabels[status]}`);
    },
    [addToast]
  );

  const getDishRating = useCallback(
    (menuItemId: string): { average: number; count: number } => {
      const matching = dishReviews.filter((r) => r.menu_item_id === menuItemId);
      if (matching.length === 0) return { average: 0, count: 0 };
      const sum = matching.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: Number((sum / matching.length).toFixed(1)),
        count: matching.length,
      };
    },
    [dishReviews]
  );

  // Live Restaurant Rating computed dynamically from ALL dish reviews + ALL order service feedbacks
  const restaurantRating = useMemo<RestaurantRatingSummary>(() => {
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const allScores: number[] = [];

    dishReviews.forEach((r) => {
      const clamped = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[clamped] += 1;
      allScores.push(clamped);
    });

    feedbacks.forEach((f) => {
      const clamped = Math.min(5, Math.max(1, Math.round(f.overall_rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[clamped] += 1;
      allScores.push(clamped);
    });

    const total = allScores.length;
    const avg = total > 0 ? Number((allScores.reduce((a, b) => a + b, 0) / total).toFixed(1)) : 5.0;

    return {
      averageRating: avg,
      totalReviews: total,
      dishReviewsCount: dishReviews.length,
      orderReviewsCount: feedbacks.length,
      distribution,
      level: computeRestaurantLevel(avg, total, feedbacks),
    };
  }, [dishReviews, feedbacks]);

  const submitDishReview = useCallback(
    async (params: {
      menu_item_id: string;
      dish_name: string;
      rating: number;
      comment: string;
      customer_name?: string;
    }): Promise<DishReview> => {
      const clampedRating = Math.min(5, Math.max(1, Math.round(params.rating)));
      const newReview: DishReview = {
        id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        menu_item_id: params.menu_item_id,
        dish_name: params.dish_name,
        table_number: activeTableNumber,
        rating: clampedRating,
        comment: params.comment.trim().slice(0, 400),
        customer_name: params.customer_name?.trim().slice(0, 60) || undefined,
        created_at: new Date().toISOString(),
      };

      const saved = await dataService.saveDishReview(newReview);
      // Immediately update state so dish rating & restaurant rating react instantly
      setDishReviews((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      return saved;
    },
    [activeTableNumber]
  );

  const submitOrderFeedback = useCallback(
    async (feedbackData: Omit<CustomerFeedback, 'id' | 'created_at'>) => {
      const newFeedback: CustomerFeedback = {
        ...feedbackData,
        id: 'feedback-' + Date.now() + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
      };
      await dataService.saveFeedback(newFeedback);
      setFeedbacks((prev) => [newFeedback, ...prev.filter((f) => f.id !== newFeedback.id)]);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore fallback
      }
      soundService.playSuccess();
      addToast(
        'success',
        "Fikringiz uchun tashakkur!",
        "Xizmat sifatini baholaganingiz uchun minnatdormiz."
      );
      await refreshData();
    },
    [addToast, refreshData]
  );

  const getFeedbackForOrder = useCallback(
    async (orderId: string): Promise<CustomerFeedback | null> => {
      const allFeedbacks = await dataService.getFeedbacks();
      return allFeedbacks.find((f) => f.order_id === orderId) || null;
    },
    []
  );

  const value = useMemo(
    () => ({
      userRole,
      currentUser,
      setUserRole,
      isDemoMode: dataService.getIsDemo(),
      activeTableNumber,
      setActiveTableNumber,
      cart,
      addToCart,
      updateCartQuantity,
      updateCartItemNote,
      removeFromCart,
      clearCart,
      cartTotal,
      cartItemCount,
      categories,
      menuItems,
      tables,
      orders,
      customerOrders,
      guestSessionId,
      serviceCalls,
      waiters,
      dishReviews,
      feedbacks,
      restaurantRating,
      getDishRating,
      submitDishReview,
      addWaiter,
      updateWaiter,
      deleteWaiter,
      updateWaiterStatus,
      submitOrderFeedback,
      getFeedbackForOrder,
      isLoading,
      soundEnabled,
      setSoundEnabled,
      audioUnlocked,
      unlockAudio,
      refreshData,
      placeOrder,
      cancelCustomerOrder,
      callWaiter,
      requestBill,
      resolveServiceCall,
      updateOrderStatus,
      settleAndFreeTable,
      customerAccount,
      allCustomerAccounts,
      refreshCustomerAccounts,
      customerTransactions,
      customerSessionMode,
      isCustomerAuthOpen,
      customerAuthInitialView,
      openCustomerAuth,
      closeCustomerAuth,
      registerCustomerAccount,
      loginCustomerAccount,
      updateCustomerAccount,
      continueAsGuest,
      endGuestSession,
      logoutCustomerAccount,
      staffAccounts,
      activeStaffAccount,
      isStaffAccountsLoaded,
      isStaffAccountModalOpen,
      editingStaffAccount,
      staffModalDefaultRole,
      openStaffAccountModal,
      closeStaffAccountModal,
      registerStaffAccount,
      loginStaffAccount,
      updateStaffAccount,
      deleteStaffAccount,
      logoutStaffAccount,
      restaurantName,
      setRestaurantName,
      restaurantBranch,
      setRestaurantBranch,
      restaurantTagline,
      setRestaurantTagline,
      logoStyle,
      setLogoStyle,
      toasts,
      addToast,
      removeToast,
      simulateWaiterNotification,
      lastResolvedCall,
      dismissResolvedCall,
    }),
    [
      userRole,
      currentUser,
      setUserRole,
      activeTableNumber,
      setActiveTableNumber,
      cart,
      addToCart,
      updateCartQuantity,
      updateCartItemNote,
      removeFromCart,
      clearCart,
      cartTotal,
      cartItemCount,
      categories,
      menuItems,
      tables,
      orders,
      customerOrders,
      guestSessionId,
      serviceCalls,
      waiters,
      dishReviews,
      feedbacks,
      restaurantRating,
      getDishRating,
      submitDishReview,
      addWaiter,
      updateWaiter,
      deleteWaiter,
      updateWaiterStatus,
      submitOrderFeedback,
      getFeedbackForOrder,
      isLoading,
      soundEnabled,
      setSoundEnabled,
      audioUnlocked,
      unlockAudio,
      refreshData,
      placeOrder,
      cancelCustomerOrder,
      callWaiter,
      requestBill,
      resolveServiceCall,
      updateOrderStatus,
      settleAndFreeTable,
      customerAccount,
      allCustomerAccounts,
      refreshCustomerAccounts,
      customerTransactions,
      customerSessionMode,
      isCustomerAuthOpen,
      customerAuthInitialView,
      openCustomerAuth,
      closeCustomerAuth,
      registerCustomerAccount,
      loginCustomerAccount,
      updateCustomerAccount,
      continueAsGuest,
      endGuestSession,
      logoutCustomerAccount,
      staffAccounts,
      activeStaffAccount,
      isStaffAccountsLoaded,
      isStaffAccountModalOpen,
      editingStaffAccount,
      staffModalDefaultRole,
      openStaffAccountModal,
      closeStaffAccountModal,
      registerStaffAccount,
      loginStaffAccount,
      updateStaffAccount,
      deleteStaffAccount,
      logoutStaffAccount,
      restaurantName,
      setRestaurantName,
      restaurantBranch,
      setRestaurantBranch,
      restaurantTagline,
      setRestaurantTagline,
      logoStyle,
      setLogoStyle,
      toasts,
      addToast,
      removeToast,
      simulateWaiterNotification,
      lastResolvedCall,
      dismissResolvedCall,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Real-time Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => {
          if (toast.type === 'new_order') {
            return (
              <div
                key={toast.id}
                className="pointer-events-auto p-4 rounded-2xl shadow-2xl border-2 border-[#173F35] bg-white/98 backdrop-blur-md flex flex-col gap-2.5 transition-all transform duration-200 animate-in fade-in slide-in-from-top-3 relative overflow-hidden ring-4 ring-[#173F35]/15"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#173F35] via-emerald-500 to-amber-400" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#173F35] text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                      <HandPlatter className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {toast.tableNumber && (
                          <span className="bg-[#173F35] text-amber-300 font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-xs tabular-nums">
                            STOL №{toast.tableNumber}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#173F35] bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                          Yangi Buyurtma
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{toast.title}</h4>
                      {toast.message && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Yopish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {toast.onAction && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                    <button
                      onClick={() => {
                        toast.onAction?.();
                        removeToast(toast.id);
                      }}
                      className="bg-[#173F35] hover:bg-[#235B4E] active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{toast.actionLabel || 'Oshxonaga uzatish'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (toast.type === 'waiter_response') {
            const isEscalated = (toast.callCount || 0) >= 3;
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border-2 bg-white/98 backdrop-blur-md flex items-start justify-between gap-3 transition-all transform duration-200 animate-in fade-in slide-in-from-top-3 relative overflow-hidden ${
                  isEscalated
                    ? 'border-red-500 ring-4 ring-red-500/15'
                    : 'border-amber-500 ring-4 ring-amber-500/15'
                }`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isEscalated
                      ? 'bg-gradient-to-r from-red-500 to-amber-500'
                      : 'bg-gradient-to-r from-[#173F35] to-amber-500'
                  }`}
                />
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isEscalated
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <BellRing className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#173F35] bg-amber-100 px-1.5 py-0.5 rounded-md">
                        Ofitsiant xizmati
                      </span>
                      {toast.tableNumber && (
                        <span className="text-[10px] font-mono font-bold text-slate-600">
                          Stol №{toast.tableNumber}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{toast.title}</h4>
                    {toast.message && (
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Yopish"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          if (toast.type === 'kitchen_ready') {
            return (
              <div
                key={toast.id}
                className="pointer-events-auto p-4 rounded-2xl shadow-2xl border-2 border-emerald-500 bg-white/98 backdrop-blur-md flex flex-col gap-2.5 transition-all transform duration-200 animate-in fade-in slide-in-from-top-3 relative overflow-hidden ring-4 ring-emerald-500/15"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-inner">
                      <ChefHat className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {toast.tableNumber && (
                          <span className="bg-[#173F35] text-amber-300 font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-xs">
                            STOL №{toast.tableNumber}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                          Taom Tayyor
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{toast.title}</h4>
                      {toast.message && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Yopish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {toast.onAction && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                    <button
                      onClick={() => {
                        toast.onAction?.();
                        removeToast(toast.id);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{toast.actionLabel || 'Yetkazildi'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (toast.type === 'admin_escalation') {
            return (
              <div
                key={toast.id}
                className="pointer-events-auto p-4 rounded-2xl shadow-2xl border-2 border-red-600 bg-white/98 backdrop-blur-md flex flex-col gap-2.5 transition-all transform duration-200 animate-in fade-in slide-in-from-top-3 relative overflow-hidden ring-4 ring-red-600/20"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 animate-pulse" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-900 flex items-center justify-center shrink-0 shadow-inner">
                      <BellRing className="w-5 h-5 text-red-600 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {toast.tableNumber && (
                          <span className="bg-red-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-xs tabular-nums">
                            STOL №{toast.tableNumber}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-900 bg-red-100 px-2 py-0.5 rounded-md border border-red-300">
                          Admin Eskalatsiyasi ({toast.callCount || 3}x)
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{toast.title}</h4>
                      {toast.message && (
                        <p className="text-xs text-slate-700 mt-0.5 leading-snug">{toast.message}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Yopish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {toast.onAction && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-100">
                    <button
                      onClick={() => {
                        toast.onAction?.();
                        removeToast(toast.id);
                      }}
                      className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{toast.actionLabel || 'Nazoratga olindi'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (toast.type === 'customer_call') {
            return (
              <div
                key={toast.id}
                className="pointer-events-auto p-4 rounded-2xl shadow-2xl border-2 border-amber-500 bg-white/98 backdrop-blur-md flex flex-col gap-2.5 transition-all transform duration-200 animate-in fade-in slide-in-from-top-3 relative overflow-hidden ring-4 ring-amber-500/15"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 animate-pulse" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
                      <BellRing className="w-5 h-5 text-amber-700 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {toast.tableNumber && (
                          <span className="bg-amber-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-xs tabular-nums">
                            STOL №{toast.tableNumber}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                          {toast.callCount && toast.callCount >= 2
                            ? `Qayta Chaqiruv (${toast.callCount}x)`
                            : 'Mijoz Chaqiruvi'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{toast.title}</h4>
                      {toast.message && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Yopish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {toast.onAction && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-100">
                    <button
                      onClick={() => {
                        toast.onAction?.();
                        removeToast(toast.id);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{toast.actionLabel || 'Qabul qilindi'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (toast.type === 'kitchen_preparing') {
            return (
              <div
                key={toast.id}
                className="pointer-events-auto p-3.5 rounded-2xl shadow-lg border border-blue-200 bg-white/98 backdrop-blur-md flex items-start justify-between gap-3 transition-all transform duration-200 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      {toast.tableNumber && (
                        <span className="bg-blue-600 text-white font-mono font-bold text-[11px] px-1.5 py-0.5 rounded">
                          №{toast.tableNumber}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
                    </div>
                    {toast.message && <p className="text-[11px] text-slate-600 mt-0.5">{toast.message}</p>}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-2xl shadow-lg border flex items-start justify-between gap-3 transition-all transform duration-200 animate-in fade-in slide-in-from-top-2 ${
                toast.type === 'success'
                  ? 'bg-white border-emerald-200 text-slate-800'
                  : toast.type === 'error'
                  ? 'bg-white border-red-200 text-red-900'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    toast.type === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : toast.type === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : toast.type === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
                  {toast.message && <p className="text-[11px] text-slate-600 mt-0.5">{toast.message}</p>}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
