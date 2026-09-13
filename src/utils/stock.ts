import { formatDistanceToNowStrict, format, differenceInCalendarDays } from 'date-fns';
import type {
  AdjustmentReason,
  InventoryItem,
  SortKey,
  StatusFilter,
  StockStatus } from
'../types/inventory';

export function stockStatus(item: InventoryItem): StockStatus {
  if (item.onHand <= 0) return 'out';
  if (item.onHand <= item.reorderPoint) return 'low';
  return 'ok';
}

export const statusLabels: Record<StockStatus, string> = {
  out: 'Out of stock',
  low: 'Low stock',
  ok: 'In stock'
};

export const reasonLabels: Record<AdjustmentReason, string> = {
  miscount: 'Miscount',
  damage: 'Damaged',
  expiry: 'Expired',
  theft: 'Missing / theft',
  found: 'Found stock',
  other: 'Other'
};

export const reasonHints: Record<AdjustmentReason, string> = {
  miscount: 'System count was simply wrong',
  damage: 'Stock damaged and discarded',
  expiry: 'Stock past its expiry date',
  theft: 'Stock unaccounted for',
  found: 'Stock located outside its usual place',
  other: 'Anything else — please add a note'
};

export function relativeTime(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function fullTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy 'at' HH:mm");
}

export function expiryLabel(iso: string | null): {text: string;urgent: boolean;} | null {
  if (!iso) return null;
  const days = differenceInCalendarDays(new Date(iso), new Date());
  if (days < 0) return { text: `Expired ${format(new Date(iso), 'd MMM yyyy')}`, urgent: true };
  if (days <= 60) return { text: `Expires in ${days} days`, urgent: true };
  return { text: `Expires ${format(new Date(iso), 'd MMM yyyy')}`, urgent: false };
}

export function stockPercent(item: InventoryItem): number {
  if (item.targetLevel <= 0) return 0;
  return Math.min(100, Math.round(item.onHand / item.targetLevel * 100));
}

export function filterAndSortItems(
items: InventoryItem[],
options: {
  query: string;
  categories: string[];
  status: StatusFilter;
  sort: SortKey;
})
: InventoryItem[] {
  const q = options.query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (options.categories.length > 0 && !options.categories.includes(item.category)) {
      return false;
    }
    if (options.status !== 'all' && stockStatus(item) !== options.status) {
      return false;
    }
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.supplier.toLowerCase().includes(q));

  });

  const sorted = [...filtered];
  switch (options.sort) {
    case 'stock-asc':
      sorted.sort((a, b) => coverage(a) - coverage(b) || a.name.localeCompare(b.name));
      break;
    case 'stock-desc':
      sorted.sort((a, b) => coverage(b) - coverage(a) || a.name.localeCompare(b.name));
      break;
    case 'category':
      sorted.sort(
        (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      );
      break;
    case 'recently-counted':
      sorted.sort(
        (a, b) => new Date(b.lastCountedAt).getTime() - new Date(a.lastCountedAt).getTime()
      );
      break;
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

function coverage(item: InventoryItem): number {
  if (item.reorderPoint <= 0) return item.onHand;
  return item.onHand / item.reorderPoint;
}

export const sortLabels: Record<SortKey, string> = {
  name: 'Name (A–Z)',
  'stock-asc': 'Lowest stock first',
  'stock-desc': 'Highest stock first',
  category: 'Category',
  'recently-counted': 'Recently counted'
};