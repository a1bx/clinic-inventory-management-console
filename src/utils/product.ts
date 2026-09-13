import type { ApiProduct } from '../api/dummyJson';
import type { InventoryItem } from '../types/inventory';

export function productToInventoryItem(product: ApiProduct): InventoryItem {
  const now = product.meta?.updatedAt ?? new Date().toISOString();
  const reorderPoint = Math.max(5, Math.ceil((product.minimumOrderQuantity ?? 10) / 2));
  return {
    id: String(product.id),
    sku: product.sku ?? `SKU-${product.id}`,
    name: product.title,
    category: product.category,
    unit: 'units',
    onHand: product.stock,
    reorderPoint,
    targetLevel: Math.max(product.stock, reorderPoint * 3),
    location: 'Main store room',
    supplier: product.brand ?? 'Catalog supplier',
    expiresOn: null,
    lastCountedAt: now,
    lastCountedBy: 'System import',
    clinicId: 'clinic-northgate',
  };
}
