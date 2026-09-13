import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { StockStatusBadge } from './StockStatusBadge';
import { StockLevelBar } from './StockLevelBar';
import { PendingSyncTag } from './SyncStatus';
import { cn } from '../utils/cn';
import { relativeTime, stockStatus } from '../utils/stock';
import { useInventory } from '../contexts/InventoryContext';
import type { InventoryItem } from '../types/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  linkSearch: string;
  onCorrect: (item: InventoryItem) => void;
}

const headCell =
'px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground';

export function InventoryTable({ items, linkSearch, onCorrect }: InventoryTableProps) {
  const { hasPendingSync } = useInventory();

  return (
    <div className="surface hidden overflow-hidden rounded-2xl lg:block">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted">
          <tr className="border-b hairline">
            <th scope="col" className={cn(headCell, 'w-[28%]')}>
              Item
            </th>
            <th scope="col" className={headCell}>
              Category
            </th>
            <th scope="col" className={headCell}>
              Location
            </th>
            <th scope="col" className={cn(headCell, 'w-[16%] text-right')}>
              On hand
            </th>
            <th scope="col" className={headCell}>
              Status
            </th>
            <th scope="col" className={headCell}>
              Last counted
            </th>
            <th scope="col" className={cn(headCell, 'text-right')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = stockStatus(item);
            return (
              <tr
                key={item.id}
                className="group row-hover border-b hairline transition-colors last:border-b-0">
                
                <td className="relative py-3.5 pl-4 pr-4 align-top">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-0 left-0 w-[3px]',
                      status === 'out' && 'bar-out',
                      status === 'low' && 'bar-low',
                      status === 'ok' && 'bg-transparent'
                    )} />
                  
                  <Link
                    to={{ pathname: `/items/${item.id}`, search: linkSearch }}
                    className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    
                    <span className="font-medium text-foreground group-hover:underline">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </span>
                  </Link>
                  {hasPendingSync(item.id) && <PendingSyncTag className="mt-1.5" />}
                </td>
                <td className="px-4 py-3.5 align-top text-muted-foreground">
                  {item.category}
                </td>
                <td className="px-4 py-3.5 align-top text-muted-foreground">
                  {item.location}
                </td>
                <td className="px-4 py-3.5 align-top">
                  <p className="tabular text-right text-base font-semibold leading-none">
                    {item.onHand}
                  </p>
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {item.unit}
                  </p>
                  <StockLevelBar item={item} className="mt-2" />
                </td>
                <td className="px-4 py-3.5 align-top">
                  <StockStatusBadge status={status} />
                </td>
                <td className="px-4 py-3.5 align-top text-muted-foreground">
                  <p>{relativeTime(item.lastCountedAt)}</p>
                  <p className="text-xs">by {item.lastCountedBy}</p>
                </td>
                <td className="py-3.5 pl-4 pr-4 align-top text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => onCorrect(item)}>
                      Correct count
                    </Button>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        to={{ pathname: `/items/${item.id}`, search: linkSearch }}
                        aria-label={`Open ${item.name}`}>
                        
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>);

          })}
        </tbody>
      </table>
    </div>);

}