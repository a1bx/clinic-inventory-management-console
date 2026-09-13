import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ApiError,
  getProducts,
  login as apiLogin,
  refreshSession,
  searchProducts,
  updateProduct,
  type ApiUser,
} from '../api/dummyJson';
import { applyClinicProfile, productToInventoryItem } from '../utils/product';
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
interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
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
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
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
    setSession(null);
    setItems([]);
    setAdjustments([]);
  }, []);
  const reload = useCallback(() => setReloadKey((value) => value + 1), []);
  const setClinicId = useCallback((nextClinicId: string) => {
    setClinicIdState(nextClinicId);
    setItems([]);
  }, []);
  const searchItems = useCallback(
    async (query: string, signal?: AbortSignal) => {
      if (!session || !query.trim()) return [];
      const response = await searchProducts(session.accessToken, query.trim(), signal);
      return (response.products ?? [])
        .map(productToInventoryItem)
        .map((item) => applyClinicProfile(item, clinicId));
    },
    [clinicId, session],
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

  const submitAdjustment = useCallback(
    async (draft: AdjustmentDraft) => {
      if (!session) return false;
      const item = items.find((candidate) => candidate.id === draft.itemId);
      if (!item) return false;
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
    [clinicId, items, session],
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
      toast.success(`${item.name} added to clinic stock`);
    },
    [clinicId, session],
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
      hasPendingSync: () => false,
      pendingCount: 0,
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
    ],
  );
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used inside InventoryProvider');
  return context;
}
