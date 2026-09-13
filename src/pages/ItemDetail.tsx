import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock3,
  Download,
  ExternalLink,
  Info,
  Link2,
  PackagePlus,
  Thermometer,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
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
  if (!item)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-semibold">Item not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This stock link may have expired or belongs to another clinic.
        </p>
        <Button className="mt-5" asChild>
          <Link to="/">Back to stock list</Link>
        </Button>
      </div>
    );

  const history = adjustmentsForItem(item.id);
  const expiry = expiryLabel(item.expiresOn);
  const clinic = clinics.find((c) => c.id === item.clinicId);
  const status = stockStatus(item);
  const coldChain = item.location.toLowerCase().includes('fridge');
  const needsReview = status !== 'ok';

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

  const exportHistory = () => {
    const rows = [
      ['Timestamp', 'Staff member', 'Previous quantity', 'Counted quantity', 'Variance', 'Reason'],
      ...history.map((entry) => [
        fullTime(entry.at),
        entry.by,
        String(entry.systemQty),
        String(entry.countedQty),
        String(entry.delta),
        entry.reason,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${item.sku}-correction-history.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Correction history exported');
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-8 lg:py-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          asChild
          className="ml-2 inline-flex items-center gap-2 text-slate-600"
        >
          <Link to={{ pathname: '/', search: location.search }}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <section className="surface surface-raised overflow-hidden rounded-2xl bg-white">
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StockStatusBadge status={status} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {item.category}
                </span>
                {coldChain && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <Thermometer className="size-3.5" />
                    Cold chain required
                  </span>
                )}
                {hasPendingSync(item.id) && <PendingSyncTag />}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {item.name}
              </h1>
              <p className="mt-2 font-mono text-xs text-slate-500 sm:text-sm">
                {item.sku}
                <span className="mx-2 text-slate-300">•</span>
                {item.location}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="lg" className="rounded-xl" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </Button>
              {needsReview && (
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => toast.info('Order request noted for the clinic procurement team')}
                >
                  <PackagePlus className="size-4" />
                  Order now
                </Button>
              )}
              <Button size="lg" className="rounded-xl" onClick={() => setAdjustOpen(true)}>
                Correct count
              </Button>
            </div>
          </div>
          <div className="mt-8 grid gap-7 border-t border-slate-100 pt-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                On hand quantity
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="tabular text-6xl font-semibold leading-none tracking-tight text-slate-950">
                  {item.onHand}
                </span>
                <span className="text-base text-slate-500">{item.unit}</span>
              </div>
              <StockLevelBar item={item} className="mt-6 max-w-2xl" />
            </div>
            <div className="lg:text-right">
              {needsReview && (
                <span className="mb-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  <Clock3 className="size-3.5" />
                  Count overdue for re-verification
                </span>
              )}
              <p className="text-sm text-slate-500">
                Last counted{' '}
                <span className="font-medium text-slate-900">
                  {relativeTime(item.lastCountedAt)}
                </span>{' '}
                by {item.lastCountedBy}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400">
                {fullTime(item.lastCountedAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="space-y-7">
          <section className="surface overflow-hidden rounded-2xl bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                  Correction history
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {history.length} {history.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="hidden rounded-lg sm:inline-flex">
                  Filter by date
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={exportHistory}>
                  <Download className="size-3.5" />
                  Export log
                </Button>
              </div>
            </div>
            <div className="min-h-64">
              <AdjustmentHistory
                adjustments={history}
                unit={item.unit}
                onRecord={() => setAdjustOpen(true)}
              />
            </div>
          </section>
          <StockFlowPanel item={item} expiry={expiry?.text} coldChain={coldChain} />
        </div>
        <ItemDetails item={item} expiry={expiry?.text} coldChain={coldChain} />
      </div>
      <AdjustStockDialog item={item} open={adjustOpen} onOpenChange={setAdjustOpen} />
    </div>
  );
}

function ItemDetails({
  item,
  expiry,
  coldChain,
}: {
  item: NonNullable<ReturnType<ReturnType<typeof useInventory>['itemById']>>;
  expiry?: string;
  coldChain: boolean;
}) {
  return (
    <aside className="surface overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
          Item details
        </h2>
        <button
          type="button"
          className="text-xs font-medium text-slate-500 hover:text-slate-900"
          onClick={() => toast.info('Item specifications are managed by clinic procurement')}
        >
          Edit specs
        </button>
      </div>
      <dl className="divide-y divide-slate-100">
        <Detail
          label="Storage location"
          value={item.location}
          badge={coldChain ? '2°C – 8°C' : undefined}
        />
        <Detail label="Supplier" value={item.supplier} />
        <Detail label="Unit of issue" value={item.unit} mono />
        <Detail label="Reorder point" value={`${item.reorderPoint} ${item.unit}`} mono />
        <Detail label="Target level" value={`${item.targetLevel} ${item.unit}`} mono />
        <Detail
          label="Expiry date"
          value={expiry ?? 'Not expiry-tracked'}
          badge={expiry ? 'Valid' : undefined}
        />
      </dl>
    </aside>
  );
}

function Detail({
  label,
  value,
  mono = false,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 px-6 py-4">
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className={cn('mt-1 text-sm font-medium text-slate-900', mono && 'font-mono')}>
          {value}
        </dd>
      </div>
      {badge && (
        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
          {badge}
        </span>
      )}
    </div>
  );
}

function StockFlowPanel({
  item,
  expiry,
  coldChain,
}: {
  item: NonNullable<ReturnType<ReturnType<typeof useInventory>['itemById']>>;
  expiry?: string;
  coldChain: boolean;
}) {
  return (
    <section className="surface overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
            Stock flow & lot distribution
          </h2>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-7">
        <FlowCard
          label="Active lot ID"
          value={`${item.sku}-A`}
          detail={expiry ? `Exp: ${expiry}` : 'No expiry tracking'}
        />
        <FlowCard
          label="Cold storage status"
          value={coldChain ? '4.1°C (Optimal 2–8°C)' : 'Ambient storage'}
          detail="Telemetry live"
          good={coldChain}
        />
        <FlowCard
          label="Suggested order qty"
          value={`${Math.max(item.targetLevel - item.onHand, item.reorderPoint)} ${item.unit}`}
          detail={
            item.onHand <= item.reorderPoint
              ? 'Immediate reorder recommended'
              : 'Routine replenishment'
          }
          warning={item.onHand <= item.reorderPoint}
        />
      </div>
    </section>
  );
}

function FlowCard({
  label,
  value,
  detail,
  good = false,
  warning = false,
}: {
  label: string;
  value: string;
  detail: string;
  good?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-2 font-mono text-sm font-semibold',
          warning ? 'text-rose-600' : 'text-slate-900',
        )}
      >
        {good && <span className="mr-1 text-emerald-500">●</span>}
        {value}
      </p>
      <p className={cn('mt-1 text-xs', warning ? 'text-rose-600' : 'text-slate-500')}>{detail}</p>
    </div>
  );
}
