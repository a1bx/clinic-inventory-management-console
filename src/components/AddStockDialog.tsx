import { FormEvent, useEffect, useState } from 'react';
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
import { useInventory } from '../contexts/InventoryContext';
import type { StockItemDraft } from '../types/inventory';

const categories = [
  'PPE & disposables',
  'Injection & blood draw',
  'Wound care',
  'Sanitation',
  'Pharmaceuticals & vaccines',
  'Reusable instruments',
  'Capital equipment',
  'Specialty products',
];

export function AddStockDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addStockItem } = useInventory();
  const [draft, setDraft] = useState<StockItemDraft>({
    name: '',
    category: categories[0],
    unit: 'each',
    location: '',
    onHand: 0,
    reorderPoint: 5,
  });
  useEffect(() => {
    if (open)
      setDraft({
        name: '',
        category: categories[0],
        unit: 'each',
        location: '',
        onHand: 0,
        reorderPoint: 5,
      });
  }, [open]);
  const update = <K extends keyof StockItemDraft>(key: K, value: StockItemDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    addStockItem({
      ...draft,
      onHand: Math.max(0, draft.onHand),
      reorderPoint: Math.max(0, draft.reorderPoint),
    });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add stock item</DialogTitle>
          <DialogDescription>Add a supply to this clinic’s local stock register.</DialogDescription>
        </DialogHeader>
        <form id="add-stock-form" className="space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="stock-name">Supply name</Label>
            <Input
              id="stock-name"
              className="mt-1.5"
              value={draft.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. Sterile gauze pads"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="stock-category">Category</Label>
              <select
                id="stock-category"
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.category}
                onChange={(event) => update('category', event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="stock-unit">Unit of issue</Label>
              <Input
                id="stock-unit"
                className="mt-1.5"
                value={draft.unit}
                onChange={(event) => update('unit', event.target.value)}
                placeholder="box of 100"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="stock-location">Storage location</Label>
            <Input
              id="stock-location"
              className="mt-1.5"
              value={draft.location}
              onChange={(event) => update('location', event.target.value)}
              placeholder="Treatment room · Cabinet 1"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="stock-on-hand">Current quantity</Label>
              <Input
                id="stock-on-hand"
                className="mt-1.5"
                type="number"
                min="0"
                value={draft.onHand}
                onChange={(event) => update('onHand', Number(event.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="stock-reorder">Reorder point</Label>
              <Input
                id="stock-reorder"
                className="mt-1.5"
                type="number"
                min="0"
                value={draft.reorderPoint}
                onChange={(event) => update('reorderPoint', Number(event.target.value))}
                required
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="lg" type="submit" form="add-stock-form" disabled={!draft.name.trim()}>
            Add to stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
