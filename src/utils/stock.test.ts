import { describe, expect, it } from 'vitest';
import { filterAndSortItems, stockStatus } from './stock';
import type { InventoryItem } from '../types/inventory';

const item = (id: string, name: string, onHand: number): InventoryItem => ({
  id,
  sku: id,
  name,
  category: 'medical',
  unit: 'units',
  onHand,
  reorderPoint: 5,
  targetLevel: 20,
  location: 'store',
  supplier: 'supplier',
  expiresOn: null,
  lastCountedAt: new Date().toISOString(),
  lastCountedBy: 'tester',
  clinicId: 'clinic-northgate',
});

describe('stock rules', () => {
  it('classifies zero and reorder-point stock correctly', () => {
    expect(stockStatus(item('1', 'zero', 0))).toBe('out');
    expect(stockStatus(item('2', 'low', 5))).toBe('low');
    expect(stockStatus(item('3', 'ok', 6))).toBe('ok');
  });

  it('filters across searchable fields and sorts without mutating input', () => {
    const source = [item('2', 'Zebra kit', 10), item('1', 'Alpha kit', 2)];
    const result = filterAndSortItems(source, {
      query: 'alpha',
      categories: [],
      status: 'all',
      sort: 'name',
    });
    expect(result.map((candidate) => candidate.id)).toEqual(['1']);
    expect(source.map((candidate) => candidate.id)).toEqual(['2', '1']);
  });
});
