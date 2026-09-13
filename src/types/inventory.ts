export type StockCategory = string;

export type StockStatus = 'out' | 'low' | 'ok';

export type AdjustmentReason = 'miscount' | 'damage' | 'expiry' | 'theft' | 'found' | 'other';

export interface Clinic {
  id: string;
  name: string;
  shortName: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: StockCategory;
  unit: string;
  onHand: number;
  reorderPoint: number;
  targetLevel: number;
  location: string;
  supplier: string;
  expiresOn: string | null;
  lastCountedAt: string;
  lastCountedBy: string;
  clinicId: string;
  sourceName?: string;
  sourceCategory?: string;
  sourceSupplier?: string;
}

export interface Adjustment {
  id: string;
  itemId: string;
  clinicId?: string;
  at: string;
  by: string;
  systemQty: number;
  countedQty: number;
  delta: number;
  reason: AdjustmentReason;
  note: string;
  synced: boolean;
}

export interface AdjustmentDraft {
  itemId: string;
  countedQty: number;
  reason: AdjustmentReason;
  note: string;
}

export interface StockItemDraft {
  name: string;
  category: string;
  unit: string;
  location: string;
  onHand: number;
  reorderPoint: number;
}

export type SortKey = 'name' | 'stock-asc' | 'stock-desc' | 'category' | 'recently-counted';

export type StatusFilter = 'all' | StockStatus;
