import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  CashbackTransaction,
  CustomerAccount,
  CustomerSessionMode,
  CustomerTier,
} from '../types';

const ACCOUNTS_LOCAL_KEY = 'dineflow_customer_accounts_v1';
const PHONE_LOCAL_MAP_KEY = 'dineflow_customer_phone_local_v1';
const TRANSACTIONS_LOCAL_KEY = 'dineflow_customer_cashback_tx_v1';
const ACTIVE_ACCOUNT_ID_KEY = 'dineflow_active_customer_account_id_v1';
const SESSION_MODE_KEY = 'dineflow_customer_session_mode_v1';
const GUEST_SESSION_ID_KEY = 'dineflow_guest_session_id_v1';
const QR_CHOICE_SEEN_KEY = 'dineflow_qr_choice_seen_v1';

export const WELCOME_BONUS_UZS = 5000;
export const CASHBACK_RATE = 0.02;
export const CASHBACK_PERCENT_LABEL = '2%';

export const TIER_CONFIG: Record<
  CustomerTier,
  {
    label: string;
    rate: number;
    percentLabel: string;
    minSpent: number;
    nextTierLabel?: string;
    nextTierThreshold?: number;
  }
> = {
  silver: {
    label: 'Doimiy mehmon',
    rate: CASHBACK_RATE,
    percentLabel: CASHBACK_PERCENT_LABEL,
    minSpent: 0,
    nextTierLabel: 'Oltin mehmon',
    nextTierThreshold: 500000,
  },
  gold: {
    label: 'Oltin mehmon',
    rate: CASHBACK_RATE,
    percentLabel: CASHBACK_PERCENT_LABEL,
    minSpent: 500000,
    nextTierLabel: 'VIP mehmon',
    nextTierThreshold: 1500000,
  },
  platinum: {
    label: 'VIP mehmon',
    rate: CASHBACK_RATE,
    percentLabel: CASHBACK_PERCENT_LABEL,
    minSpent: 1500000,
  },
};

export function computeTier(totalSpent: number): CustomerTier {
  if (totalSpent >= 1500000) return 'platinum';
  if (totalSpent >= 500000) return 'gold';
  return 'silver';
}

export function getCashbackRate(_tier?: CustomerTier): number {
  return CASHBACK_RATE;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9) return `998${digits}`;
  if (digits.startsWith('998') && digits.length >= 12) return digits.slice(0, 12);
  return digits;
}

export function isValidUzbekPhone(raw: string): boolean {
  const norm = normalizePhone(raw);
  return /^998\d{9}$/.test(norm);
}

export function formatUzbekPhone(raw: string): string {
  const norm = normalizePhone(raw);
  if (/^998\d{9}$/.test(norm)) {
    const l = norm.slice(3);
    return `+998 ${l.slice(0, 2)} ${l.slice(2, 5)}-${l.slice(5, 7)}-${l.slice(7, 9)}`;
  }
  return '+998 ';
}

function readLocalPhoneMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PHONE_LOCAL_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveLocalPhone(accountId: string, fullPhone: string): void {
  if (typeof window === 'undefined') return;
  const map = readLocalPhoneMap();
  map[accountId] = formatUzbekPhone(fullPhone);
  localStorage.setItem(PHONE_LOCAL_MAP_KEY, JSON.stringify(map));
}

export function maskPhoneDisplay(raw: string): string {
  const norm = normalizePhone(raw);
  if (norm.length === 12 && norm.startsWith('998')) {
    const op = norm.slice(3, 5);
    const last2 = norm.slice(10, 12);
    return `+998 ${op} ***-**-${last2}`;
  }
  if (norm.length >= 4) {
    return `***-${norm.slice(-4)}`;
  }
  return '***';
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(input));
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback for non-HTTPS LAN testing
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0') +
    ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
  );
}

export async function deriveAccountId(phone: string): Promise<string> {
  const norm = normalizePhone(phone);
  const digest = await sha256Hex(`${norm}:dineflow_loyalty_id_v1`);
  return `acc_${digest.slice(0, 24)}`;
}

export async function derivePinHash(phone: string, pin: string): Promise<string> {
  const norm = normalizePhone(phone);
  const digest = await sha256Hex(`${norm}:${pin.trim()}:dineflow_pin_v1`);
  return digest.slice(0, 64);
}

function readLocalAccounts(): Record<string, CustomerAccount> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CustomerAccount>) : {};
  } catch {
    return {};
  }
}

function writeLocalAccount(account: CustomerAccount): void {
  if (typeof window === 'undefined') return;
  const map = readLocalAccounts();
  map[account.id] = account;
  localStorage.setItem(ACCOUNTS_LOCAL_KEY, JSON.stringify(map));
}

function readLocalTransactions(accountId: string): CashbackTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSACTIONS_LOCAL_KEY);
    const all: Record<string, CashbackTransaction[]> = raw ? JSON.parse(raw) : {};
    return Array.isArray(all[accountId]) ? all[accountId] : [];
  } catch {
    return [];
  }
}

function writeLocalTransactions(accountId: string, list: CashbackTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(TRANSACTIONS_LOCAL_KEY);
    const all: Record<string, CashbackTransaction[]> = raw ? JSON.parse(raw) : {};
    all[accountId] = list.slice(0, 100);
    localStorage.setItem(TRANSACTIONS_LOCAL_KEY, JSON.stringify(all));
  } catch {
    // Ignore quota errors
  }
}

function appendLocalTransaction(accountId: string, tx: CashbackTransaction): CashbackTransaction[] {
  const existing = readLocalTransactions(accountId);
  const updated = [tx, ...existing.filter((t) => t.id !== tx.id)].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  writeLocalTransactions(accountId, updated);
  return updated;
}

class CustomerAccountService {
  public getSavedSessionMode(): CustomerSessionMode {
    if (typeof window === 'undefined') return 'undecided';
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
    if (activeId) return 'account';
    const mode = localStorage.getItem(SESSION_MODE_KEY);
    if (mode === 'guest') return 'guest';
    return 'undecided';
  }

  public getOrCreateGuestSessionId(): string {
    if (typeof window === 'undefined') return 'guest_ssr';
    try {
      const existing = sessionStorage.getItem(GUEST_SESSION_ID_KEY);
      if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) {
        return existing;
      }
      const fresh = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(GUEST_SESSION_ID_KEY, fresh);
      return fresh;
    } catch {
      return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  public resetGuestSessionId(): string {
    const fresh = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(GUEST_SESSION_ID_KEY, fresh);
        sessionStorage.removeItem(QR_CHOICE_SEEN_KEY);
      } catch {
        // Ignore storage restrictions
      }
    }
    return fresh;
  }

  public setGuestSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    localStorage.setItem(SESSION_MODE_KEY, 'guest');
    this.getOrCreateGuestSessionId();
  }

  public clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    localStorage.setItem(SESSION_MODE_KEY, 'undecided');
    this.resetGuestSessionId();
  }

  public getCachedActiveAccount(): CustomerAccount | null {
    if (typeof window === 'undefined') return null;
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
    if (!activeId) return null;
    const map = readLocalAccounts();
    return map[activeId] || null;
  }

  public getLocalPhoneForAccount(accountId: string): string {
    return readLocalPhoneMap()[accountId] || '+998 ';
  }

  public getCachedAllAccounts(): CustomerAccount[] {
    return Object.values(readLocalAccounts()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async checkPhoneAlreadyRegistered(phone: string, excludeAccountId?: string): Promise<boolean> {
    if (!isValidUzbekPhone(phone)) return false;
    const normPhone = normalizePhone(phone);
    const accountId = await deriveAccountId(normPhone);
    if (excludeAccountId && accountId === excludeAccountId) {
      return false;
    }
    if (readLocalAccounts()[accountId]) {
      return true;
    }
    try {
      const snap = await getDoc(doc(db, 'customer_accounts', accountId));
      if (snap.exists()) {
        writeLocalAccount(snap.data() as CustomerAccount);
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `customer_accounts/${accountId}`);
    }
    return false;
  }

  public async listAllAccounts(): Promise<CustomerAccount[]> {
    const localMap = readLocalAccounts();
    try {
      const q = query(
        collection(db, 'customer_accounts'),
        where('tier', 'in', ['silver', 'gold', 'platinum']),
        limit(250)
      );
      const snap = await getDocs(q);
      const merged = new Map<string, CustomerAccount>();
      Object.values(localMap).forEach((acc) => merged.set(acc.id, acc));
      snap.docs.forEach((d) => {
        const remote = d.data() as CustomerAccount;
        const prev = merged.get(remote.id);
        if (!prev || new Date(remote.updated_at).getTime() >= new Date(prev.updated_at).getTime()) {
          merged.set(remote.id, remote);
          writeLocalAccount(remote);
        }
      });
      return Array.from(merged.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'customer_accounts');
      return this.getCachedAllAccounts();
    }
  }

  public subscribeAllAccounts(callback: (accounts: CustomerAccount[]) => void): () => void {
    const q = query(
      collection(db, 'customer_accounts'),
      where('tier', 'in', ['silver', 'gold', 'platinum']),
      limit(250)
    );
    return onSnapshot(
      q,
      (snap) => {
        const merged = new Map<string, CustomerAccount>();
        Object.values(readLocalAccounts()).forEach((acc) => merged.set(acc.id, acc));
        snap.docs.forEach((d) => {
          const remote = d.data() as CustomerAccount;
          const prev = merged.get(remote.id);
          if (!prev || new Date(remote.updated_at).getTime() >= new Date(prev.updated_at).getTime()) {
            merged.set(remote.id, remote);
            writeLocalAccount(remote);
          }
        });
        const sorted = Array.from(merged.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        callback(sorted);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'customer_accounts');
        callback(this.getCachedAllAccounts());
      }
    );
  }

  public async loadActiveAccount(): Promise<{
    account: CustomerAccount | null;
    transactions: CashbackTransaction[];
  }> {
    if (typeof window === 'undefined') return { account: null, transactions: [] };
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
    if (!activeId) return { account: null, transactions: [] };

    const localAcc = readLocalAccounts()[activeId] || null;
    let account = localAcc;

    // Refresh from Firestore in case guest used another device
    try {
      const snap = await getDoc(doc(db, 'customer_accounts', activeId));
      if (snap.exists()) {
        const remote = snap.data() as CustomerAccount;
        if (!localAcc || new Date(remote.updated_at).getTime() >= new Date(localAcc.updated_at).getTime()) {
          account = remote;
          writeLocalAccount(remote);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `customer_accounts/${activeId}`);
    }

    if (!account) {
      return { account: null, transactions: [] };
    }

    const transactions = await this.getTransactions(account.id);
    return { account, transactions };
  }

  public async getTransactions(accountId: string): Promise<CashbackTransaction[]> {
    const localTx = readLocalTransactions(accountId);
    try {
      const q = query(
        collection(db, 'customer_accounts', accountId, 'transactions'),
        where('account_id', '==', accountId),
        limit(50)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteTx = snap.docs.map((d) => d.data() as CashbackTransaction);
        const map = new Map<string, CashbackTransaction>();
        localTx.forEach((t) => map.set(t.id, t));
        remoteTx.forEach((t) => map.set(t.id, t));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        writeLocalTransactions(accountId, merged);
        return merged;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `customer_accounts/${accountId}/transactions`);
    }
    return localTx;
  }

  public async registerAccount(params: {
    fullName: string;
    phone: string;
    pin: string;
  }): Promise<{ account: CustomerAccount; transactions: CashbackTransaction[] }> {
    const cleanName = params.fullName.trim().slice(0, 80);
    const normPhone = normalizePhone(params.phone);
    const cleanPin = params.pin.trim();

    if (cleanName.length < 2) {
      throw new Error("Iltimos, ismingizni to'liq kiriting (kamida 2 ta harf).");
    }
    if (!isValidUzbekPhone(params.phone)) {
      throw new Error("Faqat O'zbekiston raqami (+998 XX XXX-XX-XX) bilan ro'yxatdan o'tish mumkin.");
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error("PIN-kod aniq 4 ta raqamdan iborat bo'lishi kerak.");
    }

    const accountId = await deriveAccountId(normPhone);
    const pinHash = await derivePinHash(normPhone, cleanPin);

    // Check if account already exists locally or in Firestore
    const existingLocal = readLocalAccounts()[accountId];
    if (existingLocal) {
      throw new Error("Bu telefon raqam bilan kabinet allaqachon ochilgan. 'Kirish' bo'limidan kiring.");
    }

    try {
      const remoteSnap = await getDoc(doc(db, 'customer_accounts', accountId));
      if (remoteSnap.exists()) {
        throw new Error("Bu telefon raqam bilan kabinet allaqachon ochilgan. 'Kirish' bo'limidan kiring.");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('allaqachon ochilgan')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.GET, `customer_accounts/${accountId}`);
    }

    const now = new Date().toISOString();
    const newAccount: CustomerAccount = {
      id: accountId,
      full_name: cleanName,
      phone_masked: maskPhoneDisplay(normPhone),
      pin_hash: pinHash,
      cashback_balance: WELCOME_BONUS_UZS,
      total_spent: 0,
      total_orders: 0,
      tier: 'silver',
      created_at: now,
      updated_at: now,
    };

    const welcomeTx: CashbackTransaction = {
      id: `tx-welcome-${Date.now()}`,
      account_id: accountId,
      type: 'welcome_bonus',
      amount: WELCOME_BONUS_UZS,
      description: 'Shaxsiy kabinet ochilgani uchun xush kelibsiz keshbeki',
      created_at: now,
    };

    writeLocalAccount(newAccount);
    saveLocalPhone(accountId, normPhone);
    const txList = appendLocalTransaction(accountId, welcomeTx);
    localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, accountId);
    localStorage.setItem(SESSION_MODE_KEY, 'account');

    // Sync to Firestore so customer can log in on future visits or other devices
    try {
      await setDoc(doc(db, 'customer_accounts', accountId), newAccount);
      await setDoc(doc(db, 'customer_accounts', accountId, 'transactions', welcomeTx.id), welcomeTx);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `customer_accounts/${accountId}`);
    }

    return { account: newAccount, transactions: txList };
  }

  public async loginAccount(params: {
    phone: string;
    pin: string;
  }): Promise<{ account: CustomerAccount; transactions: CashbackTransaction[] }> {
    const normPhone = normalizePhone(params.phone);
    const cleanPin = params.pin.trim();

    if (!isValidUzbekPhone(params.phone)) {
      throw new Error("Faqat O'zbekiston raqami (+998 XX XXX-XX-XX) bilan kirish mumkin.");
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error("4 xonali PIN-kodingizni kiriting.");
    }

    const accountId = await deriveAccountId(normPhone);
    const pinHash = await derivePinHash(normPhone, cleanPin);

    let found: CustomerAccount | null = readLocalAccounts()[accountId] || null;

    try {
      const snap = await getDoc(doc(db, 'customer_accounts', accountId));
      if (snap.exists()) {
        found = snap.data() as CustomerAccount;
        writeLocalAccount(found);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `customer_accounts/${accountId}`);
    }

    if (!found) {
      throw new Error("Bu telefon raqam bo'yicha kabinet topilmadi. Avval ro'yxatdan o'ting.");
    }
    if (found.pin_hash !== pinHash) {
      throw new Error("PIN-kod noto'g'ri. Qayta tekshirib kiriting.");
    }

    saveLocalPhone(found.id, normPhone);
    localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, found.id);
    localStorage.setItem(SESSION_MODE_KEY, 'account');
    const transactions = await this.getTransactions(found.id);

    return { account: found, transactions };
  }

  public async updateAccount(
    account: CustomerAccount,
    params: {
      fullName: string;
      newPhone?: string;
      currentPin?: string;
      newPin?: string;
    }
  ): Promise<{ account: CustomerAccount; transactions: CashbackTransaction[] }> {
    const cleanName = params.fullName.trim().slice(0, 80);
    if (cleanName.length < 2) {
      throw new Error("Ismingiz kamida 2 ta harfdan iborat bo'lishi kerak.");
    }

    const currentLocalPhone = this.getLocalPhoneForAccount(account.id);
    const desiredPhone = params.newPhone?.trim() || currentLocalPhone;
    const isPhoneChangeRequested =
      Boolean(params.newPhone?.trim()) &&
      isValidUzbekPhone(params.newPhone!.trim()) &&
      formatUzbekPhone(params.newPhone!.trim()) !== currentLocalPhone;

    if (params.newPhone?.trim() && !isValidUzbekPhone(params.newPhone.trim())) {
      throw new Error("Faqat O'zbekiston raqami (+998 XX XXX-XX-XX) kiritilishi shart.");
    }

    const cleanCurrentPin = (params.currentPin || '').trim();
    const cleanNewPin = (params.newPin || '').trim();

    if (cleanNewPin && !/^\d{4}$/.test(cleanNewPin)) {
      throw new Error("Yangi PIN-kod aniq 4 ta raqamdan iborat bo'lishi kerak.");
    }

    const now = new Date().toISOString();

    // Verify current PIN if changing PIN or changing phone number
    if (isPhoneChangeRequested || cleanNewPin) {
      if (!/^\d{4}$/.test(cleanCurrentPin)) {
        throw new Error("Telefon raqam yoki PIN-kodni o'zgartirish uchun joriy 4 xonali PIN-kodingizni kiriting.");
      }
      if (isValidUzbekPhone(currentLocalPhone)) {
        const expectedOldHash = await derivePinHash(normalizePhone(currentLocalPhone), cleanCurrentPin);
        if (expectedOldHash !== account.pin_hash) {
          throw new Error("Joriy PIN-kod noto'g'ri kiritildi.");
        }
      }
    }

    // Case 1: Phone number changed — migrate account + cashback + transactions to new hashed ID
    if (isPhoneChangeRequested) {
      const nextNormPhone = normalizePhone(desiredPhone);
      const nextAccountId = await deriveAccountId(nextNormPhone);
      const pinToUse = cleanNewPin || cleanCurrentPin;
      const nextPinHash = await derivePinHash(nextNormPhone, pinToUse);

      if (nextAccountId !== account.id) {
        const existingTarget = readLocalAccounts()[nextAccountId];
        if (existingTarget) {
          throw new Error("Bu yangi telefon raqam bilan boshqa kabinet allaqachon ochilgan.");
        }
        try {
          const remoteSnap = await getDoc(doc(db, 'customer_accounts', nextAccountId));
          if (remoteSnap.exists()) {
            throw new Error("Bu yangi telefon raqam bilan boshqa kabinet allaqachon ochilgan.");
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes('allaqachon ochilgan')) {
            throw err;
          }
          handleFirestoreError(err, OperationType.GET, `customer_accounts/${nextAccountId}`);
        }
      }

      const migratedAccount: CustomerAccount = {
        ...account,
        id: nextAccountId,
        full_name: cleanName,
        phone_masked: maskPhoneDisplay(nextNormPhone),
        pin_hash: nextPinHash,
        updated_at: now,
      };

      const oldTxs = readLocalTransactions(account.id);
      const migratedTxs = oldTxs.map((tx) => ({ ...tx, account_id: nextAccountId }));

      writeLocalAccount(migratedAccount);
      saveLocalPhone(nextAccountId, nextNormPhone);
      writeLocalTransactions(nextAccountId, migratedTxs);
      localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, nextAccountId);

      // Keep local orders linked to the updated customer account ID & name
      try {
        const rawOrders = localStorage.getItem('dineflow_orders_v3');
        if (rawOrders) {
          const parsedOrders = JSON.parse(rawOrders);
          if (Array.isArray(parsedOrders)) {
            const updatedOrders = parsedOrders.map((o: any) =>
              o.customer_account_id === account.id
                ? { ...o, customer_account_id: nextAccountId, customer_name: cleanName }
                : o
            );
            localStorage.setItem('dineflow_orders_v3', JSON.stringify(updatedOrders));
          }
        }
      } catch {
        // Ignore storage error
      }

      try {
        await setDoc(doc(db, 'customer_accounts', nextAccountId), migratedAccount);
        for (const tx of migratedTxs.slice(0, 30)) {
          await setDoc(doc(db, 'customer_accounts', nextAccountId, 'transactions', tx.id), tx);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `customer_accounts/${nextAccountId}`);
      }

      return { account: migratedAccount, transactions: migratedTxs };
    }

    // Case 2: Same phone — update name and optionally PIN
    let nextPinHash = account.pin_hash;
    if (cleanNewPin) {
      if (!isValidUzbekPhone(currentLocalPhone)) {
        throw new Error("PIN-kodni o'zgartirish uchun telefon raqamingizni ham to'liq kiriting.");
      }
      nextPinHash = await derivePinHash(normalizePhone(currentLocalPhone), cleanNewPin);
    }

    const updatedAccount: CustomerAccount = {
      ...account,
      full_name: cleanName,
      pin_hash: nextPinHash,
      updated_at: now,
    };

    writeLocalAccount(updatedAccount);
    const transactions = readLocalTransactions(account.id);

    try {
      await updateDoc(doc(db, 'customer_accounts', account.id), {
        full_name: updatedAccount.full_name,
        pin_hash: updatedAccount.pin_hash,
        updated_at: updatedAccount.updated_at,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customer_accounts/${account.id}`);
    }

    return { account: updatedAccount, transactions };
  }

  /**
   * Called at order placement: deducts ONLY cashback spent by customer.
   * Does NOT grant 2% earned cashback yet — cashback is granted strictly once order is 'delivered'.
   * That guarantees cancelled orders never grant cashback.
   */
  public async reserveOrderCashbackUsage(
    account: CustomerAccount,
    params: {
      orderId: string;
      orderNumber: string;
      subtotalAmount: number;
      cashbackUsed: number;
    }
  ): Promise<{
    account: CustomerAccount;
    transactions: CashbackTransaction[];
    cashbackUsed: number;
    expectedCashbackEarned: number;
  }> {
    const safeUsed = Math.min(
      account.cashback_balance,
      params.subtotalAmount,
      Math.max(0, Math.round(params.cashbackUsed))
    );
    const payableAmount = Math.max(0, params.subtotalAmount - safeUsed);
    const expectedCashbackEarned = Math.round(payableAmount * CASHBACK_RATE);

    let txList = readLocalTransactions(account.id);
    const spendTxId = `tx-spend-${params.orderId}`;

    if (safeUsed <= 0 || txList.some((t) => t.id === spendTxId)) {
      return {
        account,
        transactions: txList,
        cashbackUsed: safeUsed,
        expectedCashbackEarned,
      };
    }

    const now = new Date().toISOString();
    const updatedAccount: CustomerAccount = {
      ...account,
      cashback_balance: Math.max(0, account.cashback_balance - safeUsed),
      updated_at: now,
    };

    const spendTx: CashbackTransaction = {
      id: spendTxId,
      account_id: account.id,
      type: 'spent',
      amount: safeUsed,
      order_id: params.orderId,
      order_number: params.orderNumber,
      description: `${params.orderNumber} buyurtma to'lovida ishlatildi`,
      created_at: now,
    };

    writeLocalAccount(updatedAccount);
    txList = appendLocalTransaction(account.id, spendTx);

    try {
      await updateDoc(doc(db, 'customer_accounts', account.id), {
        cashback_balance: updatedAccount.cashback_balance,
        updated_at: updatedAccount.updated_at,
      });
      await setDoc(doc(db, 'customer_accounts', account.id, 'transactions', spendTx.id), spendTx);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customer_accounts/${account.id}`);
    }

    return {
      account: updatedAccount,
      transactions: txList,
      cashbackUsed: safeUsed,
      expectedCashbackEarned,
    };
  }

  /**
   * Called strictly when an order reaches status === 'delivered'.
   * Idempotent via tx-earn-${orderId}: credits exact 2% cashback once per delivered order.
   */
  public async creditDeliveredOrderCashback(
    account: CustomerAccount,
    params: {
      orderId: string;
      orderNumber: string;
      payableAmount: number;
    }
  ): Promise<{
    account: CustomerAccount;
    transactions: CashbackTransaction[];
    creditedAmount: number;
  }> {
    const earnTxId = `tx-earn-${params.orderId}`;
    let txList = readLocalTransactions(account.id);

    // Already credited locally? Skip to keep strictly idempotent
    if (txList.some((t) => t.id === earnTxId)) {
      return { account, transactions: txList, creditedAmount: 0 };
    }

    // Also check remote Firestore transaction doc so multi-device never double-credits
    try {
      const existingRemote = await getDoc(
        doc(db, 'customer_accounts', account.id, 'transactions', earnTxId)
      );
      if (existingRemote.exists()) {
        const remoteTx = existingRemote.data() as CashbackTransaction;
        txList = appendLocalTransaction(account.id, remoteTx);
        return { account, transactions: txList, creditedAmount: 0 };
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `customer_accounts/${account.id}/transactions/${earnTxId}`
      );
    }

    const payable = Math.max(0, Math.round(params.payableAmount));
    const earned = Math.round(payable * CASHBACK_RATE);
    const now = new Date().toISOString();

    const nextTotalSpent = account.total_spent + payable;
    const nextTotalOrders = account.total_orders + 1;
    const nextBalance = account.cashback_balance + earned;
    const nextTier = computeTier(nextTotalSpent);

    const updatedAccount: CustomerAccount = {
      ...account,
      cashback_balance: nextBalance,
      total_spent: nextTotalSpent,
      total_orders: nextTotalOrders,
      tier: nextTier,
      updated_at: now,
    };

    writeLocalAccount(updatedAccount);

    const earnTx: CashbackTransaction | null =
      earned > 0
        ? {
            id: earnTxId,
            account_id: account.id,
            type: 'earned',
            amount: earned,
            order_id: params.orderId,
            order_number: params.orderNumber,
            description: `${params.orderNumber} yakunlangan buyurtmadan ${CASHBACK_PERCENT_LABEL} keshbek`,
            created_at: now,
          }
        : null;

    if (earnTx) {
      txList = appendLocalTransaction(account.id, earnTx);
    }

    try {
      await updateDoc(doc(db, 'customer_accounts', account.id), {
        cashback_balance: updatedAccount.cashback_balance,
        total_spent: updatedAccount.total_spent,
        total_orders: updatedAccount.total_orders,
        tier: updatedAccount.tier,
        updated_at: updatedAccount.updated_at,
      });
      if (earnTx) {
        await setDoc(doc(db, 'customer_accounts', account.id, 'transactions', earnTx.id), earnTx);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customer_accounts/${account.id}`);
    }

    return {
      account: updatedAccount,
      transactions: txList,
      creditedAmount: earned,
    };
  }

  /**
   * Called when an order is cancelled (by customer or staff).
   * Grants ZERO cashback and idempotently refunds ONLY any cashback_used that was reserved.
   */
  public async refundCancelledOrderCashback(
    account: CustomerAccount,
    params: {
      orderId: string;
      orderNumber: string;
      cashbackUsed: number;
    }
  ): Promise<{ account: CustomerAccount; transactions: CashbackTransaction[]; refundedAmount: number }> {
    const used = Math.max(0, Math.round(params.cashbackUsed));
    const refundTxId = `tx-refund-${params.orderId}`;
    let txList = readLocalTransactions(account.id);

    if (used <= 0 || txList.some((t) => t.id === refundTxId)) {
      return { account, transactions: txList, refundedAmount: 0 };
    }

    try {
      const existingRemote = await getDoc(
        doc(db, 'customer_accounts', account.id, 'transactions', refundTxId)
      );
      if (existingRemote.exists()) {
        const remoteTx = existingRemote.data() as CashbackTransaction;
        txList = appendLocalTransaction(account.id, remoteTx);
        return { account, transactions: txList, refundedAmount: 0 };
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `customer_accounts/${account.id}/transactions/${refundTxId}`
      );
    }

    const now = new Date().toISOString();
    const updatedAccount: CustomerAccount = {
      ...account,
      cashback_balance: account.cashback_balance + used,
      updated_at: now,
    };

    const refundTx: CashbackTransaction = {
      id: refundTxId,
      account_id: account.id,
      type: 'refunded',
      amount: used,
      order_id: params.orderId,
      order_number: params.orderNumber,
      description: `${params.orderNumber} bekor qilindi — ishlatilgan keshbek qaytarildi`,
      created_at: now,
    };

    writeLocalAccount(updatedAccount);
    txList = appendLocalTransaction(account.id, refundTx);

    try {
      await updateDoc(doc(db, 'customer_accounts', account.id), {
        cashback_balance: updatedAccount.cashback_balance,
        updated_at: updatedAccount.updated_at,
      });
      await setDoc(doc(db, 'customer_accounts', account.id, 'transactions', refundTx.id), refundTx);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customer_accounts/${account.id}`);
    }

    return { account: updatedAccount, transactions: txList, refundedAmount: used };
  }
}

export const customerAccountService = new CustomerAccountService();
