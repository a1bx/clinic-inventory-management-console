import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Button } from './ui/Button';
import { StockStatusBadge } from './StockStatusBadge';
import { StockLevelBar } from './StockLevelBar';
import { PendingSyncTag } from './SyncStatus';
import { relativeTime, stockStatus } from '../utils/stock';
import { useInventory } from '../contexts/InventoryContext';
import type { InventoryItem } from '../types/inventory';

interface InventoryCardsProps {
  items: InventoryItem[];
  linkSearch: string;
  onCorrect: (item: InventoryItem) => void;
}

export function InventoryCards({ items, linkSearch, onCorrect }: InventoryCardsProps) {
  const { hasPendingSync } = useInventory();

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
      {items.map((item) => (
        <li key={item.id} className="surface overflow-hidden rounded-2xl">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <Link
                to={{ pathname: `/items/${item.id}`, search: linkSearch }}
                className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="font-medium leading-snug">{item.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {item.sku} · {item.category}
                </p>
              </Link>
              <StockStatusBadge status={stockStatus(item)} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="tabular text-3xl font-semibold leading-none">{item.onHand}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.unit}</p>
              </div>
              <StockLevelBar item={item} className="flex-1 pb-0.5" />
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {item.location}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Counted {relativeTime(item.lastCountedAt)} by {item.lastCountedBy}
            </p>

            {hasPendingSync(item.id) && <PendingSyncTag className="mt-2" />}
          </div>

          <div className="flex gap-2 border-t hairline bg-muted p-3">
            <Button variant="default" size="lg" className="flex-1" onClick={() => onCorrect(item)}>
              Correct count
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to={{ pathname: `/items/${item.id}`, search: linkSearch }}>Details</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
