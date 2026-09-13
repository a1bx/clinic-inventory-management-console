import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ApiError,
  getProducts,
  login as apiLogin,
  refreshSession,
  updateProduct,
  type ApiUser,
} from '../api/dummyJson';
import {
  applyClinicProfile,
  isItemAvailableAtClinic,
  productToInventoryItem,
} from '../utils/product';
import type {
  Adjustment,
  AdjustmentDraft,
  InventoryItem,
  StockItemDraft,
} from '../types/inventory';

const SESSION_KEY = 'savannah-session';
const OVERRIDES_KEY = 'savannah-stock-overrides';
const ADDED_ITEMS_KEY = 'savannah-added-items';
const ADJUSTMENTS_KEY = 'savannah-adjustments';
const PENDING_KEY = 'savannah-pending-sync';
interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}
interface PendingChange {
  id: string;
  type: 'adjustment' | 'addition';
  clinicId: string;
  itemId: string;
  adjustmentId?: string;
  countedQty?: number;
}

function getQueuedCount(change: PendingChange) {
  return change.countedQty ?? 0;
}
interface InventoryContextValue {
  authenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  user: ApiUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
  items: InventoryItem[];
  searchItems: (query: string, signal?: AbortSignal) => Promise<InventoryItem[]>;
  adjustments: Adjustment[];
  adjustmentsForItem: (itemId: string) => Adjustment[];
  itemById: (itemId: string) => InventoryItem | undefined;
  hasPendingSync: (itemId: string) => boolean;
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  setIsOnline: (online: boolean) => void;
  submitAdjustment: (draft: AdjustmentDraft) => Promise<boolean>;
  addStockItem: (draft: StockItemDraft) => void;
  clinicId: string;
  setClinicId: (clinicId: string) => void;
}
const InventoryContext = createContext<InventoryContextValue | null>(null);

function readSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(readSession);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(() =>
    readStorage(ADJUSTMENTS_KEY, []),
  );
  const [isOnline, setIsOnlineState] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>(() =>
    readStorage(PENDING_KEY, []),
  );
  const [clinicId, setClinicIdState] = useState('clinic-northgate');
  const [reloadKey, setReloadKey] = useState(0);

  const login = useCallback(async (username: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const next = await apiLogin(username, password);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setAuthLoading(false);
    }
  }, []);
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(OVERRIDES_KEY);
    sessionStorage.removeItem(ADDED_ITEMS_KEY);
    sessionStorage.removeItem(ADJUSTMENTS_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    setSession(null);
    setItems([]);
    setAdjustments([]);
  }, []);
  const reload = useCallback(() => setReloadKey((value) => value + 1), []);
  const setClinicId = useCallback((nextClinicId: string) => {
    setClinicIdState(nextClinicId);
    setItems([]);
  }, []);
  const setIsOnline = useCallback((online: boolean) => setIsOnlineState(online), []);
  const enqueuePending = useCallback((change: PendingChange) => {
    setPendingChanges((current) => {
      const next = [...current, change];
      writeStorage(PENDING_KEY, next);
      return next;
    });
  }, []);
  const searchItems = useCallback(
    async (query: string, signal?: AbortSignal) => {
      if (!session || !query.trim() || signal?.aborted) return [];
      const normalized = query.trim().toLowerCase();
      return items.filter((item) =>
        [item.name, item.sku, item.category, item.location, item.supplier]
          .filter(Boolean)
          .some((value) => typeof value === 'string' && value.toLowerCase().includes(normalized)),
      );
    },
    [items, session],
  );

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProducts(session.accessToken, { limit: 194 })
      .then((response) => {
        if (!cancelled) {
          const overrides = readStorage<Record<string, Partial<InventoryItem>>>(OVERRIDES_KEY, {});
          const addedItems = readStorage<InventoryItem[]>(ADDED_ITEMS_KEY, []);
          const apiItems = (response.products ?? [])
            .map(productToInventoryItem)
            .map((item) => applyClinicProfile(item, clinicId))
            .filter((item) => isItemAvailableAtClinic(item, clinicId))
            .map((item) => ({ ...item, ...overrides[`${clinicId}:${item.id}`] }));
          setItems([...addedItems.filter((item) => item.clinicId === clinicId), ...apiItems]);
          setAdjustments(readStorage<Adjustment[]>(ADJUSTMENTS_KEY, []));
        }
      })
      .catch(async (err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401 && session.refreshToken) {
          try {
            const next = await refreshSession(session.refreshToken);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
            setSession(next);
            return;
          } catch {
            logout();
            setError('Your session expired. Please sign in again.');
            return;
          }
        }
        setError(err instanceof Error ? err.message : 'Could not load stock.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicId, session, reloadKey, logout]);

  useEffect(() => {
    if (!isOnline || !session || pendingChanges.length === 0) return;
    let cancelled = false;
    const sync = async () => {
      setIsSyncing(true);
      const completed: PendingChange[] = [];
      for (const change of pendingChanges) {
        if (change.type === 'addition') {
          completed.push(change);
          continue;
        }
        try {
          await updateProduct(session.accessToken, change.itemId, getQueuedCount(change));
          completed.push(change);
        } catch {
          // Leave failed changes queued for the next reconnect attempt.
        }
      }
      if (!cancelled && completed.length > 0) {
        const completedIds = new Set(completed.map((change) => change.id));
        setPendingChanges((current) => {
          const next = current.filter((change) => !completedIds.has(change.id));
          writeStorage(PENDING_KEY, next);
          return next;
        });
        setAdjustments((current) => {
          const adjustmentIds = new Set(
            completed.map((change) => change.adjustmentId).filter(Boolean),
          );
          const next = current.map((adjustment) =>
            adjustmentIds.has(adjustment.id) ? { ...adjustment, synced: true } : adjustment,
          );
          writeStorage(ADJUSTMENTS_KEY, next);
          return next;
        });
        toast.success(
          `Synced ${completed.length} saved change${completed.length === 1 ? '' : 's'}`,
        );
      }
      if (!cancelled) setIsSyncing(false);
    };
    const timer = window.setTimeout(() => void sync(), 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOnline, pendingChanges, session]);

  const submitAdjustment = useCallback(
    async (draft: AdjustmentDraft) => {
      if (!session) return false;
      const item = items.find((candidate) => candidate.id === draft.itemId);
      if (!item) return false;
      if (!isOnline) {
        const countedAt = new Date().toISOString();
        const adjustment: Adjustment = {
          id: `adj-${Date.now()}`,
          itemId: draft.itemId,
          clinicId,
          at: countedAt,
          by: session ? `${session.user.firstName} ${session.user.lastName}` : 'Current user',
          systemQty: item.onHand,
          countedQty: draft.countedQty,
          delta: draft.countedQty - item.onHand,
          reason: draft.reason,
          note: draft.note.trim(),
          synced: false,
        };
        const savedItem = {
          ...item,
          onHand: draft.countedQty,
          lastCountedAt: countedAt,
          lastCountedBy: adjustment.by,
        };
        setItems((current) =>
          current.map((candidate) => (candidate.id === savedItem.id ? savedItem : candidate)),
        );
        const overrides = readStorage<Record<string, Partial<InventoryItem>>>(OVERRIDES_KEY, {});
        overrides[`${clinicId}:${savedItem.id}`] = {
          onHand: savedItem.onHand,
          lastCountedAt: savedItem.lastCountedAt,
          lastCountedBy: savedItem.lastCountedBy,
        };
        writeStorage(OVERRIDES_KEY, overrides);
        setAdjustments((current) => {
          const next = [adjustment, ...current];
          writeStorage(ADJUSTMENTS_KEY, next);
          return next;
        });
        enqueuePending({
          id: `pending-${adjustment.id}`,
          type: 'adjustment',
          clinicId,
          itemId: draft.itemId,
          adjustmentId: adjustment.id,
          countedQty: draft.countedQty,
        });
        toast.success(`Saved ${item.name} offline`, {
          description: 'This correction is waiting to sync.',
        });
        return true;
      }
      setIsSyncing(true);
      try {
        let activeSession = session;
        let updated: Awaited<ReturnType<typeof updateProduct>>;
        try {
          updated = await updateProduct(activeSession.accessToken, draft.itemId, draft.countedQty);
        } catch (err) {
          if (!(err instanceof ApiError) || err.status !== 401 || !activeSession.refreshToken)
            throw err;
          activeSession = await refreshSession(activeSession.refreshToken);
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
          setSession(activeSession);
          updated = await updateProduct(activeSession.accessToken, draft.itemId, draft.countedQty);
        }
        const mapped = applyClinicProfile(productToInventoryItem(updated), clinicId);
        const countedAt = new Date().toISOString();
        const savedItem = {
          ...mapped,
          onHand: draft.countedQty,
          lastCountedAt: countedAt,
          lastCountedBy: `${activeSession.user.firstName} ${activeSession.user.lastName}`,
        };
        setItems((current) =>
          current.map((candidate) => (candidate.id === savedItem.id ? savedItem : candidate)),
        );
        const adjustment: Adjustment = {
          id: `adj-${Date.now()}`,
          itemId: draft.itemId,
          at: countedAt,
          by: `${activeSession.user.firstName} ${activeSession.user.lastName}`,
          systemQty: item.onHand,
          countedQty: draft.countedQty,
          delta: draft.countedQty - item.onHand,
          reason: draft.reason,
          note: draft.note.trim(),
          synced: true,
          clinicId,
        };
        setAdjustments((current) => {
          const next = [adjustment, ...current];
          writeStorage(ADJUSTMENTS_KEY, next);
          return next;
        });
        const overrides = readStorage<Record<string, Partial<InventoryItem>>>(OVERRIDES_KEY, {});
        overrides[`${clinicId}:${savedItem.id}`] = {
          onHand: savedItem.onHand,
          lastCountedAt: savedItem.lastCountedAt,
          lastCountedBy: savedItem.lastCountedBy,
        };
        writeStorage(OVERRIDES_KEY, overrides);
        toast.success(`Saved ${item.name} at ${draft.countedQty} units`);
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not save correction', {
          description: 'The original stock count is unchanged. Try again.',
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [clinicId, enqueuePending, isOnline, items, session],
  );

  const addStockItem = useCallback(
    (draft: StockItemDraft) => {
      const item: InventoryItem = {
        id: `local-${Date.now()}`,
        sku: `CLN-${String(Date.now()).slice(-6)}`,
        name: draft.name.trim(),
        category: draft.category,
        unit: draft.unit.trim() || 'each',
        onHand: draft.onHand,
        reorderPoint: draft.reorderPoint,
        targetLevel: Math.max(draft.reorderPoint * 3, draft.onHand),
        location: draft.location.trim() || 'Central store · Unassigned',
        supplier: 'Clinic procurement',
        expiresOn: null,
        lastCountedAt: new Date().toISOString(),
        lastCountedBy: session
          ? `${session.user.firstName} ${session.user.lastName}`
          : 'Current user',
        clinicId,
      };
      setItems((current) => [item, ...current]);
      const addedItems = readStorage<InventoryItem[]>(ADDED_ITEMS_KEY, []);
      writeStorage(ADDED_ITEMS_KEY, [item, ...addedItems]);
      if (!isOnline) {
        enqueuePending({
          id: `pending-${item.id}`,
          type: 'addition',
          clinicId,
          itemId: item.id,
        });
        toast.success(`${item.name} saved offline`, {
          description: 'This stock item is waiting to sync.',
        });
      } else {
        toast.success(`${item.name} added to clinic stock`);
      }
    },
    [clinicId, enqueuePending, isOnline, session],
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      authenticated: Boolean(session),
      authLoading,
      authError,
      user: session?.user ?? null,
      login,
      logout,
      loading,
      error,
      reload,
      items,
      searchItems,
      adjustments,
      adjustmentsForItem: (itemId) =>
        adjustments.filter(
          (item) => item.itemId === itemId && (item.clinicId ?? 'clinic-northgate') === clinicId,
        ),
      itemById: (itemId) => items.find((item) => item.id === itemId),
      hasPendingSync: (itemId) =>
        pendingChanges.some((change) => change.itemId === itemId && change.clinicId === clinicId),
      pendingCount: pendingChanges.filter((change) => change.clinicId === clinicId).length,
      isOnline,
      isSyncing,
      setIsOnline,
      submitAdjustment,
      addStockItem,
      clinicId,
      setClinicId,
    }),
    [
      session,
      authLoading,
      authError,
      login,
      logout,
      loading,
      error,
      reload,
      items,
      searchItems,
      adjustments,
      isOnline,
      isSyncing,
      submitAdjustment,
      addStockItem,
      clinicId,
      setClinicId,
      setIsOnline,
      pendingChanges,
    ],
  );
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used inside InventoryProvider');
  return context;
}
