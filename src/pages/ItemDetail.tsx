import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Link2, PackageSearch } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StockStatusBadge } from '../components/StockStatusBadge';
import { StockLevelBar } from '../components/StockLevelBar';
import { AdjustStockDialog } from '../components/AdjustStockDialog';
import { AdjustmentHistory } from '../components/AdjustmentHistory';
import { PendingSyncTag } from '../components/SyncStatus';
import { useInventory } from '../contexts/InventoryContext';
import { cn } from '../utils/cn';
import { expiryLabel, fullTime, relativeTime, stockStatus } from '../utils/stock';
import { clinics } from '../data/inventory';

export function ItemDetail() {
  const { itemId = '' } = useParams();
  const location = useLocation();
  const { itemById, adjustmentsForItem, hasPendingSync, loading, error, reload } = useInventory();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const item = itemById(itemId);

  if (loading)
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center" aria-busy="true">
        <p className="text-sm text-muted-foreground">Loading item…</p>
      </div>
    );
  if (error)
    return (
      <div role="alert" className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-lg font-semibold">Couldn’t load this item</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-5" onClick={reload}>
          Try again
        </Button>
      </div>
    );

  if (!item) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <PackageSearch className="size-5" />
        </span>
        <h1 className="mt-3 text-lg font-semibold">Item not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This link may point to an item from another clinic, or one that has been retired.
        </p>
        <Button className="mt-5" asChild>
          <Link to="/">Back to stock list</Link>
        </Button>
      </div>
    );
  }

  const history = adjustmentsForItem(item.id);
  const expiry = expiryLabel(item.expiresOn);
  const clinic = clinics.find((c) => c.id === item.clinicId);
  const status = stockStatus(item);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied — paste it into chat');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={{ pathname: '/', search: location.search }}>
          <ArrowLeft className="size-4" />
          All stock
        </Link>
      </Button>

      <section className="surface surface-raised mt-4 overflow-hidden rounded-2xl">
        <div
          aria-hidden="true"
          className={cn(
            'h-1 w-full',
            status === 'out' && 'bar-out',
            status === 'low' && 'bar-low',
            status === 'ok' && 'bar-ok',
          )}
        />

        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StockStatusBadge status={status} />
                <span className="text-xs text-muted-foreground">{item.category}</span>
                {hasPendingSync(item.id) && <PendingSyncTag />}
              </div>
              <h1 className="mt-2.5 text-2xl font-semibold sm:text-3xl">{item.name}</h1>
              <p className="mt-1.5 font-mono text-sm text-muted-foreground">
                {item.sku} · {clinic?.name}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="lg" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
                Copy link
              </Button>
              <Button size="lg" onClick={() => setAdjustOpen(true)}>
                Correct count
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t hairline pt-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                On hand
              </p>
              <p className="tabular mt-1.5 text-5xl font-semibold leading-none">
                {item.onHand}
                <span className="ml-2 align-baseline text-sm font-normal text-muted-foreground">
                  {item.unit}
                </span>
              </p>
            </div>
            <StockLevelBar item={item} className="flex-1 pb-1 sm:max-w-sm" />
            <p className="text-xs text-muted-foreground sm:ml-auto sm:text-right">
              Last counted {relativeTime(item.lastCountedAt)} by {item.lastCountedBy}
              <span className="block">{fullTime(item.lastCountedAt)}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Correction history
          </h2>
          <AdjustmentHistory adjustments={history} unit={item.unit} />
        </section>

        <aside className="surface h-fit rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Item details
          </h2>
          <dl className="mt-4 space-y-3.5 text-sm">
            <Detail label="Storage location" value={item.location} />
            <Detail label="Supplier" value={item.supplier} />
            <Detail label="Unit of issue" value={item.unit} />
            <Detail label="Reorder point" value={`${item.reorderPoint} ${item.unit}`} mono />
            <Detail label="Target level" value={`${item.targetLevel} ${item.unit}`} mono />
            <div>
              <dt className="text-xs text-muted-foreground">Expiry</dt>
              <dd
                className={cn(
                  'mt-0.5 font-medium',
                  expiry?.urgent ? 'text-destructive' : 'text-foreground',
                )}
              >
                {expiry ? expiry.text : 'Not expiry-tracked'}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <AdjustStockDialog item={item} open={adjustOpen} onOpenChange={setAdjustOpen} />
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 font-medium', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}
