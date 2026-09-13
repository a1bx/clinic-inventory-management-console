import React, { useEffect, useState } from 'react';
import { CloudOff, Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { cn } from '../utils/cn';
import { reasonHints, reasonLabels } from '../utils/stock';
import { useInventory } from '../contexts/InventoryContext';
import type { AdjustmentReason, InventoryItem } from '../types/inventory';

const reasons = Object.keys(reasonLabels) as AdjustmentReason[];

interface AdjustStockDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustStockDialog({ item, open, onOpenChange }: AdjustStockDialogProps) {
  const { submitAdjustment, isOnline, isSyncing } = useInventory();
  const [counted, setCounted] = useState('0');
  const [reason, setReason] = useState<AdjustmentReason | null>(null);
  const [note, setNote] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  useEffect(() => {
    if (open && item) {
      setCounted(String(item.onHand));
      setReason(null);
      setNote('');
      setShowReasonError(false);
    }
  }, [open, item]);

  if (!item) return null;

  const parsed = Number.parseInt(counted, 10);
  const countedQty = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  const delta = countedQty === null ? 0 : countedQty - item.onHand;
  const matches = countedQty !== null && delta === 0;
  const needsReason = !matches;
  const needsNote = reason === 'other';

  const step = (by: number) => {
    const base = countedQty ?? item.onHand;
    setCounted(String(Math.max(0, base + by)));
  };

  const canSubmit =
    countedQty !== null &&
    (!needsReason || (reason !== null && (!needsNote || note.trim().length > 0)));

  const handleSubmit = async () => {
    if (countedQty === null) return;
    if (needsReason && !reason) {
      setShowReasonError(true);
      return;
    }
    const saved = await submitAdjustment({
      itemId: item.id,
      countedQty,
      reason: matches ? 'miscount' : (reason as AdjustmentReason),
      note,
    });
    if (saved) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Correct stock count</DialogTitle>
          <DialogDescription>
            {item.name} · <span className="font-mono">{item.sku}</span> · {item.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border hairline bg-muted p-4">
            <Label
              htmlFor="counted-qty"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Physical count you observed
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => step(-1)}
                aria-label="Decrease count by one"
                disabled={(countedQty ?? 0) <= 0}
              >
                <Minus className="size-4" />
              </Button>
              <Input
                id="counted-qty"
                inputMode="numeric"
                value={counted}
                onChange={(e) => setCounted(e.target.value.replace(/[^0-9]/g, ''))}
                aria-invalid={countedQty === null}
                className="tabular h-12 flex-1 rounded-xl bg-card text-center text-2xl font-semibold"
              />

              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => step(1)}
                aria-label="Increase count by one"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-muted-foreground">
                System says{' '}
                <span className="font-mono font-medium text-foreground">{item.onHand}</span>{' '}
                {item.unit}
              </p>
              <p
                className={cn(
                  'font-mono font-medium',
                  matches ? 'text-muted-foreground' : delta > 0 ? 'text-good' : 'text-destructive',
                )}
                aria-live="polite"
              >
                {matches ? 'No variance' : `Variance ${delta > 0 ? '+' : ''}${delta} ${item.unit}`}
              </p>
            </div>
          </div>

          {needsReason && (
            <fieldset>
              <legend className="text-sm font-medium">Reason for the variance</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {reasons.map((value) => {
                  const active = reason === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setReason(value);
                        setShowReasonError(false);
                      }}
                      aria-pressed={active}
                      title={reasonHints[value]}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {reasonLabels[value]}
                    </button>
                  );
                })}
              </div>
              {reason && (
                <p className="mt-2 text-xs text-muted-foreground">{reasonHints[reason]}</p>
              )}
              {showReasonError && !reason && (
                <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                  Pick a reason so the correction can be audited.
                </p>
              )}
            </fieldset>
          )}

          <div>
            <Label htmlFor="adjust-note" className="text-sm">
              Note {needsNote ? '(required)' : '(optional)'}
            </Label>
            <Textarea
              id="adjust-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything the next person should know"
              className="mt-2"
            />
          </div>

          {!isOnline && (
            <p className="status-low flex items-start gap-2 rounded-lg border p-3 text-xs">
              <CloudOff className="mt-0.5 size-4 shrink-0" />
              You are offline. This correction saves on the tablet and syncs automatically when the
              wifi returns.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="lg" onClick={() => void handleSubmit()} disabled={!canSubmit || isSyncing}>
            {isSyncing ? 'Saving…' : matches ? 'Confirm count matches' : 'Save correction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
