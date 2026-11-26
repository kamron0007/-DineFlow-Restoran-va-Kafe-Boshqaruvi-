import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { StaffAccount, StaffAccountRole } from '../types';
import {
  derivePinHash,
  maskPhoneDisplay,
  normalizePhone,
} from './customerAccount';
import { extractUzLocalDigits, formatUzFullPhone, isValidUzPhone } from '../components/UzPhoneInput';

const STAFF_ACCOUNTS_KEY = 'dineflow_staff_accounts_v2';
const ACTIVE_STAFF_ID_KEY = 'dineflow_active_staff_account_id_v2';

export const STAFF_ROLE_LABELS: Record<StaffAccountRole, string> = {
  admin: 'Administrator',
  waiter: 'Ofitsiant',
  kitchen: 'Oshpaz (Oshxona)',
};

export const STAFF_ROLE_PREFIX: Record<StaffAccountRole, string> = {
  admin: 'AD',
  waiter: 'OF',
  kitchen: 'OS',
};

function sanitizeForFirestore(acc: StaffAccount): Omit<StaffAccount, 'phone_local'> {
  return {
    id: acc.id,
    role: acc.role,
    full_name: acc.full_name,
    phone_masked: acc.phone_masked,
    pin_hash: acc.pin_hash,
    badge_id: acc.badge_id,
    status: acc.status,
    assigned_tables: Array.isArray(acc.assigned_tables) ? acc.assigned_tables.slice(0, 50) : [],
    created_at: acc.created_at,
    updated_at: acc.updated_at,
  };
}

function readLocalStaff(): StaffAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StaffAccount[]) : [];
  } catch {
    return [];
  }
}

function writeLocalStaff(list: StaffAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(list));
}

async function deriveStaffAccountId(role: StaffAccountRole, phone: string): Promise<string> {
  const norm = normalizePhone(phone);
  const hash = await derivePinHash(norm, `staff_${role}`);
  return `stf_${role}_${hash.slice(0, 20)}`;
}

class StaffAccountService {
  public async ensureSeeded(): Promise<StaffAccount[]> {
    const local = readLocalStaff();

    // Background merge with Firestore using role-constrained queries matching firestore.rules
    try {
      const roles: StaffAccountRole[] = ['admin', 'waiter', 'kitchen'];
      const snaps = await Promise.all(
        roles.map((r) =>
          getDocs(query(collection(db, 'staff_accounts'), where('role', '==', r), limit(50)))
        )
      );
      const remoteDocs = snaps.flatMap((s) => s.docs);
      if (remoteDocs.length > 0) {
        const map = new Map<string, StaffAccount>();
        local.forEach((a) => map.set(a.id, a));
        remoteDocs.forEach((d) => {
          const remote = d.data() as StaffAccount;
          const existing = map.get(remote.id);
          if (
            !existing ||
            new Date(remote.updated_at).getTime() >= new Date(existing.updated_at).getTime()
          ) {
            map.set(remote.id, {
              ...remote,
              phone_local: existing?.phone_local,
            });
          }
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        writeLocalStaff(merged);
        return merged;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'staff_accounts');
    }

    return local;
  }

  public getCachedStaffAccounts(): StaffAccount[] {
    return readLocalStaff();
  }

  public subscribeStaffAccounts(onUpdate: (accounts: StaffAccount[]) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const roles: StaffAccountRole[] = ['admin', 'waiter', 'kitchen'];
    const roleDocs = new Map<StaffAccountRole, StaffAccount[]>();

    const emitMerged = () => {
      const local = readLocalStaff();
      const map = new Map<string, StaffAccount>();
      local.forEach((a) => map.set(a.id, a));

      roleDocs.forEach((list) => {
        list.forEach((remote) => {
          const existing = map.get(remote.id);
          if (
            !existing ||
            new Date(remote.updated_at).getTime() >= new Date(existing.updated_at).getTime()
          ) {
            map.set(remote.id, {
              ...remote,
              phone_local: existing?.phone_local,
            });
          }
        });
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      writeLocalStaff(merged);
      onUpdate(merged);
    };

    const unsubscribers = roles.map((r) => {
      const q = query(collection(db, 'staff_accounts'), where('role', '==', r), limit(50));
      return onSnapshot(
        q,
        (snap) => {
          roleDocs.set(
            r,
            snap.docs.map((d) => d.data() as StaffAccount)
          );
          emitMerged();
        },
        (error) => {
          console.error(`Firestore staff_accounts (${r}) onSnapshot error:`, error);
        }
      );
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  public getActiveStaffAccount(): StaffAccount | null {
    if (typeof window === 'undefined') return null;
    const id = localStorage.getItem(ACTIVE_STAFF_ID_KEY);
    if (!id) return null;
    return readLocalStaff().find((a) => a.id === id) || null;
  }

  public setActiveStaffAccountId(id: string | null): void {
    if (typeof window === 'undefined') return;
    if (id) {
      localStorage.setItem(ACTIVE_STAFF_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_STAFF_ID_KEY);
    }
  }

  public suggestBadgeId(role: StaffAccountRole, accounts: StaffAccount[]): string {
    const prefix = STAFF_ROLE_PREFIX[role];
    const nums = accounts
      .filter((a) => a.role === role)
      .map((a) => {
        const m = a.badge_id?.match(/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      });
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    return `${prefix}-${next < 10 ? '0' + next : next}`;
  }

  public async registerStaffAccount(params: {
    role: StaffAccountRole;
    fullName: string;
    phone: string;
    pin: string;
    badgeId?: string;
    assignedTables?: number[];
  }): Promise<StaffAccount> {
    const cleanName = params.fullName.trim().slice(0, 80);
    const cleanPin = params.pin.trim();

    if (cleanName.length < 2) {
      throw new Error("Xodim ism-familiyasini to'liq kiriting (kamida 2 ta harf).");
    }
    if (!isValidUzPhone(params.phone)) {
      throw new Error("Faqat O'zbekiston raqami (+998 XX XXX-XX-XX) bilan akkaunt ochish mumkin.");
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error("PIN-kod aniq 4 ta raqamdan iborat bo'lishi shart.");
    }

    const normPhone = `998${extractUzLocalDigits(params.phone)}`;
    const staffId = await deriveStaffAccountId(params.role, normPhone);
    const pinHash = await derivePinHash(normPhone, cleanPin);

    const existingList = await this.ensureSeeded();
    if (existingList.some((a) => a.id === staffId)) {
      throw new Error(
        `Bu raqam bilan ${STAFF_ROLE_LABELS[params.role]} akkaunti allaqachon yaratilgan.`
      );
    }

    const now = new Date().toISOString();
    const badge = (params.badgeId?.trim() || this.suggestBadgeId(params.role, existingList))
      .toUpperCase()
      .slice(0, 24);

    const newAccount: StaffAccount = {
      id: staffId,
      role: params.role,
      full_name: cleanName,
      phone_masked: maskPhoneDisplay(normPhone),
      phone_local: formatUzFullPhone(normPhone),
      pin_hash: pinHash,
      badge_id: badge,
      status: 'active',
      assigned_tables:
        params.role === 'waiter' ? (params.assignedTables || []).slice(0, 50) : [],
      created_at: now,
      updated_at: now,
    };

    const updated = [newAccount, ...existingList];
    writeLocalStaff(updated);

    try {
      await setDoc(doc(db, 'staff_accounts', staffId), sanitizeForFirestore(newAccount));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `staff_accounts/${staffId}`);
    }

    return newAccount;
  }

  public async loginStaffAccount(params: {
    role: StaffAccountRole;
    phone: string;
    pin: string;
  }): Promise<StaffAccount> {
    if (!isValidUzPhone(params.phone)) {
      throw new Error("Faqat O'zbekiston raqami (+998 XX XXX-XX-XX) bilan kirish mumkin.");
    }
    const cleanPin = params.pin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error("4 xonali PIN-kodingizni kiriting.");
    }

    const normPhone = `998${extractUzLocalDigits(params.phone)}`;
    const staffId = await deriveStaffAccountId(params.role, normPhone);
    const pinHash = await derivePinHash(normPhone, cleanPin);

    const list = await this.ensureSeeded();
    let found = list.find((a) => a.id === staffId) || null;

    if (!found) {
      try {
        const snap = await getDoc(doc(db, 'staff_accounts', staffId));
        if (snap.exists()) {
          found = {
            ...(snap.data() as StaffAccount),
            phone_local: formatUzFullPhone(normPhone),
          };
          writeLocalStaff([found, ...list.filter((a) => a.id !== found!.id)]);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `staff_accounts/${staffId}`);
      }
    }

    if (!found) {
      throw new Error(
        `Bu raqam bo'yicha ${STAFF_ROLE_LABELS[params.role]} akkaunti topilmadi. Avval akkaunt yarating.`
      );
    }
    if (found.status === 'inactive') {
      throw new Error("Ushbu xodim akkaunti vaqtincha nofaol holatda.");
    }
    if (found.pin_hash !== pinHash) {
      throw new Error("PIN-kod noto'g'ri. Qayta tekshirib kiriting.");
    }

    // Store formatted local phone so editing works cleanly
    if (!found.phone_local) {
      found = { ...found, phone_local: formatUzFullPhone(normPhone) };
      writeLocalStaff(list.map((a) => (a.id === found!.id ? found! : a)));
    }

    this.setActiveStaffAccountId(found.id);
    return found;
  }

  public async updateStaffAccount(
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
  ): Promise<StaffAccount> {
    const cleanName = params.fullName.trim().slice(0, 80);
    if (cleanName.length < 2) {
      throw new Error("Ism-familiya kamida 2 ta harfdan iborat bo'lishi kerak.");
    }

    const list = await this.ensureSeeded();
    const existing = list.find((a) => a.id === accountId);
    if (!existing) {
      throw new Error("Tahrirlanayotgan xodim akkaunti topilmadi.");
    }

    const trimmedPin = (params.newPin || '').trim();
    if (trimmedPin && !/^\d{4}$/.test(trimmedPin)) {
      throw new Error("Yangi PIN-kod aniq 4 ta raqamdan iborat bo'lishi kerak.");
    }

    const effectivePhone = params.phone?.trim() || existing.phone_local || '';
    const phoneChanged =
      Boolean(params.phone?.trim()) &&
      isValidUzPhone(params.phone!.trim()) &&
      formatUzFullPhone(params.phone!.trim()) !== existing.phone_local;
    const roleChanged = params.role !== existing.role;

    if (params.phone?.trim() && !isValidUzPhone(params.phone.trim())) {
      throw new Error("Faqat O'zbekiston raqami (+998 XX XXX-XX-XX) kiritilishi shart.");
    }

    const now = new Date().toISOString();

    // If phone or role changed, re-derive ID so login lookup always stays accurate
    if ((phoneChanged || roleChanged) && isValidUzPhone(effectivePhone)) {
      const normPhone = `998${extractUzLocalDigits(effectivePhone)}`;
      const nextId = await deriveStaffAccountId(params.role, normPhone);
      if (nextId !== existing.id && list.some((a) => a.id === nextId)) {
        throw new Error(
          `Bu raqam va rol (${STAFF_ROLE_LABELS[params.role]}) bilan boshqa akkaunt allaqachon mavjud.`
        );
      }

      // If phone changed without a new PIN, require a 4-digit PIN so pin_hash matches new phone
      if (phoneChanged && !trimmedPin) {
        throw new Error("Telefon raqamini o'zgartirish uchun 4 xonali PIN-kodni ham kiriting.");
      }

      const nextPinHash = trimmedPin
        ? await derivePinHash(normPhone, trimmedPin)
        : existing.pin_hash;

      const migrated: StaffAccount = {
        ...existing,
        id: nextId,
        role: params.role,
        full_name: cleanName,
        phone_masked: maskPhoneDisplay(normPhone),
        phone_local: formatUzFullPhone(normPhone),
        pin_hash: nextPinHash,
        badge_id: (params.badgeId?.trim() || existing.badge_id).toUpperCase().slice(0, 24),
        status: params.status || existing.status,
        assigned_tables:
          params.role === 'waiter'
            ? (params.assignedTables ?? existing.assigned_tables ?? []).slice(0, 50)
            : [],
        updated_at: now,
      };

      const nextList = [migrated, ...list.filter((a) => a.id !== existing.id && a.id !== nextId)];
      writeLocalStaff(nextList);

      if (this.getActiveStaffAccount()?.id === existing.id || localStorage.getItem(ACTIVE_STAFF_ID_KEY) === existing.id) {
        this.setActiveStaffAccountId(migrated.id);
      }

      try {
        await setDoc(doc(db, 'staff_accounts', migrated.id), sanitizeForFirestore(migrated));
        if (migrated.id !== existing.id) {
          await deleteDoc(doc(db, 'staff_accounts', existing.id));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `staff_accounts/${migrated.id}`);
      }

      return migrated;
    }

    // In-place update (same phone & role)
    let nextPinHash = existing.pin_hash;
    if (trimmedPin) {
      if (!isValidUzPhone(effectivePhone)) {
        throw new Error("PIN-kodni yangilash uchun +998 raqamingizni to'liq kiriting.");
      }
      const normPhone = `998${extractUzLocalDigits(effectivePhone)}`;
      nextPinHash = await derivePinHash(normPhone, trimmedPin);
    }

    const updatedAccount: StaffAccount = {
      ...existing,
      full_name: cleanName,
      pin_hash: nextPinHash,
      badge_id: (params.badgeId?.trim() || existing.badge_id).toUpperCase().slice(0, 24),
      status: params.status || existing.status,
      assigned_tables:
        existing.role === 'waiter'
          ? (params.assignedTables ?? existing.assigned_tables ?? []).slice(0, 50)
          : [],
      updated_at: now,
    };

    const nextList = list.map((a) => (a.id === existing.id ? updatedAccount : a));
    writeLocalStaff(nextList);

    try {
      await updateDoc(doc(db, 'staff_accounts', existing.id), {
        full_name: updatedAccount.full_name,
        pin_hash: updatedAccount.pin_hash,
        badge_id: updatedAccount.badge_id,
        status: updatedAccount.status,
        assigned_tables: updatedAccount.assigned_tables || [],
        updated_at: updatedAccount.updated_at,
      });
    } catch (error) {
      // Fallback to setDoc if seeded account wasn't created in Firestore yet
      try {
        await setDoc(doc(db, 'staff_accounts', existing.id), sanitizeForFirestore(updatedAccount));
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.UPDATE, `staff_accounts/${existing.id}`);
      }
    }

    return updatedAccount;
  }

  public async deleteStaffAccount(accountId: string): Promise<void> {
    const list = readLocalStaff();
    writeLocalStaff(list.filter((a) => a.id !== accountId));
    if (localStorage.getItem(ACTIVE_STAFF_ID_KEY) === accountId) {
      this.setActiveStaffAccountId(null);
    }
    try {
      await deleteDoc(doc(db, 'staff_accounts', accountId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `staff_accounts/${accountId}`);
    }
  }
}

export const staffAccountService = new StaffAccountService();
