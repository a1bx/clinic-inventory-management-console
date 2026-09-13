import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, getProducts, login as apiLogin, refreshSession, updateProduct, type ApiUser } from '../api/dummyJson';
import { productToInventoryItem } from '../utils/product';
import type { Adjustment, AdjustmentDraft, InventoryItem } from '../types/inventory';

const SESSION_KEY = 'savannah-session';
interface StoredSession { accessToken: string; refreshToken: string; user: ApiUser; }
interface InventoryContextValue {
  authenticated: boolean; authLoading: boolean; authError: string | null; user: ApiUser | null;
  login: (username: string, password: string) => Promise<void>; logout: () => void;
  loading: boolean; error: string | null; reload: () => void; items: InventoryItem[];
  adjustments: Adjustment[]; adjustmentsForItem: (itemId: string) => Adjustment[];
  itemById: (itemId: string) => InventoryItem | undefined; hasPendingSync: (itemId: string) => boolean;
  pendingCount: number; isOnline: boolean; isSyncing: boolean; setIsOnline: (online: boolean) => void;
  submitAdjustment: (draft: AdjustmentDraft) => Promise<boolean>; clinicId: string; setClinicId: (clinicId: string) => void;
}
const InventoryContext = createContext<InventoryContextValue | null>(null);

function readSession(): StoredSession | null {
  try { const raw = sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as StoredSession : null; } catch { return null; }
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(readSession);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [clinicId, setClinicId] = useState('clinic-northgate');
  const [reloadKey, setReloadKey] = useState(0);

  const login = useCallback(async (username: string, password: string) => {
    setAuthLoading(true); setAuthError(null);
    try { const next = await apiLogin(username, password); sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); setSession(next); }
    catch (err) { setAuthError(err instanceof Error ? err.message : 'Could not sign in.'); }
    finally { setAuthLoading(false); }
  }, []);
  const logout = useCallback(() => { sessionStorage.removeItem(SESSION_KEY); setSession(null); setItems([]); }, []);
  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true); setError(null);
    getProducts(session.accessToken, { limit: 194 }).then((response) => {
      if (!cancelled) setItems((response.products ?? []).map(productToInventoryItem));
    }).catch(async (err: unknown) => {
      if (cancelled) return;
      if (err instanceof ApiError && err.status === 401 && session.refreshToken) {
        try { const next = await refreshSession(session.refreshToken); sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); setSession(next); return; }
        catch { logout(); setError('Your session expired. Please sign in again.'); return; }
      }
      setError(err instanceof Error ? err.message : 'Could not load stock.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session, reloadKey, logout]);

  const submitAdjustment = useCallback(async (draft: AdjustmentDraft) => {
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
        if (!(err instanceof ApiError) || err.status !== 401 || !activeSession.refreshToken) throw err;
        activeSession = await refreshSession(activeSession.refreshToken);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
        setSession(activeSession);
        updated = await updateProduct(activeSession.accessToken, draft.itemId, draft.countedQty);
      }
      const mapped = productToInventoryItem(updated);
      setItems((current) => current.map((candidate) => candidate.id === mapped.id ? mapped : candidate));
      setAdjustments((current) => [{ id: `adj-${Date.now()}`, itemId: draft.itemId, at: new Date().toISOString(), by: `${activeSession.user.firstName} ${activeSession.user.lastName}`, systemQty: item.onHand, countedQty: draft.countedQty, delta: draft.countedQty - item.onHand, reason: draft.reason, note: draft.note.trim(), synced: true }, ...current]);
      toast.success(`Saved ${item.name} at ${draft.countedQty} units`); return true;
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not save correction', { description: 'The original stock count is unchanged. Try again.' }); return false; }
    finally { setIsSyncing(false); }
  }, [items, session]);

  const value = useMemo<InventoryContextValue>(() => ({
    authenticated: Boolean(session), authLoading, authError, user: session?.user ?? null, login, logout,
    loading, error, reload, items, adjustments,
    adjustmentsForItem: (itemId) => adjustments.filter((item) => item.itemId === itemId),
    itemById: (itemId) => items.find((item) => item.id === itemId), hasPendingSync: () => false, pendingCount: 0,
    isOnline, isSyncing, setIsOnline, submitAdjustment, clinicId, setClinicId,
  }), [session, authLoading, authError, login, logout, loading, error, reload, items, adjustments, isOnline, isSyncing, submitAdjustment, clinicId]);
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
export function useInventory(): InventoryContextValue { const context = useContext(InventoryContext); if (!context) throw new Error('useInventory must be used inside InventoryProvider'); return context; }
