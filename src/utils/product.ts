import type { ApiProduct } from '../api/dummyJson';
import type { InventoryItem } from '../types/inventory';

interface ClinicalCatalogItem {
  name: string;
  category: string;
  unit: string;
  location: string;
  expiryTracked: boolean;
}

// The API provides the record count and stock values; this local catalogue supplies
// the clinic-facing labels that DummyJSON's retail data does not contain.
const clinicalCatalog: ClinicalCatalogItem[] = [
  {
    name: 'Nitrile examination gloves · medium',
    category: 'PPE & disposables',
    unit: 'box of 100',
    location: 'PPE store · Shelf A',
    expiryTracked: true,
  },
  {
    name: 'Nitrile examination gloves · large',
    category: 'PPE & disposables',
    unit: 'box of 100',
    location: 'PPE store · Shelf A',
    expiryTracked: true,
  },
  {
    name: 'Procedure masks',
    category: 'PPE & disposables',
    unit: 'box of 50',
    location: 'PPE store · Shelf B',
    expiryTracked: true,
  },
  {
    name: 'Face shields',
    category: 'PPE & disposables',
    unit: 'each',
    location: 'PPE store · Shelf B',
    expiryTracked: false,
  },
  {
    name: 'Isolation gowns',
    category: 'PPE & disposables',
    unit: 'pack of 10',
    location: 'PPE store · Shelf C',
    expiryTracked: true,
  },
  {
    name: 'Disposable shoe covers',
    category: 'PPE & disposables',
    unit: 'pack of 100',
    location: 'PPE store · Shelf C',
    expiryTracked: true,
  },
  {
    name: 'Luer-lock syringes · 5 mL',
    category: 'Injection & blood draw',
    unit: 'box of 100',
    location: 'Treatment room · Cabinet 1',
    expiryTracked: true,
  },
  {
    name: 'Safety needles · 21G',
    category: 'Injection & blood draw',
    unit: 'box of 100',
    location: 'Treatment room · Cabinet 1',
    expiryTracked: true,
  },
  {
    name: 'Safety needles · 25G',
    category: 'Injection & blood draw',
    unit: 'box of 100',
    location: 'Treatment room · Cabinet 1',
    expiryTracked: true,
  },
  {
    name: 'Blood collection tubes · EDTA',
    category: 'Injection & blood draw',
    unit: 'pack of 50',
    location: 'Diagnostics · Drawer 2',
    expiryTracked: true,
  },
  {
    name: 'Blood collection tubes · serum',
    category: 'Injection & blood draw',
    unit: 'pack of 50',
    location: 'Diagnostics · Drawer 2',
    expiryTracked: true,
  },
  {
    name: 'Safety lancets',
    category: 'Injection & blood draw',
    unit: 'box of 100',
    location: 'Diagnostics · Drawer 3',
    expiryTracked: true,
  },
  {
    name: 'IV administration sets',
    category: 'Injection & blood draw',
    unit: 'box of 25',
    location: 'Treatment room · Cabinet 3',
    expiryTracked: true,
  },
  {
    name: 'Sterile gauze pads · 10 × 10 cm',
    category: 'Wound care',
    unit: 'pack of 25',
    location: 'Treatment room · Drawer 1',
    expiryTracked: true,
  },
  {
    name: 'Adhesive wound dressings',
    category: 'Wound care',
    unit: 'box of 50',
    location: 'Treatment room · Drawer 1',
    expiryTracked: true,
  },
  {
    name: 'Medical adhesive tape',
    category: 'Wound care',
    unit: 'roll',
    location: 'Treatment room · Drawer 2',
    expiryTracked: false,
  },
  {
    name: 'Cotton wool balls',
    category: 'Wound care',
    unit: 'bag of 100',
    location: 'Treatment room · Drawer 2',
    expiryTracked: true,
  },
  {
    name: 'Suture kits',
    category: 'Wound care',
    unit: 'kit',
    location: 'Procedure room · Cabinet 2',
    expiryTracked: true,
  },
  {
    name: 'Alcohol prep pads',
    category: 'Sanitation',
    unit: 'box of 100',
    location: 'Sanitation store · Shelf A',
    expiryTracked: true,
  },
  {
    name: 'Surface disinfectant wipes',
    category: 'Sanitation',
    unit: 'tub of 160',
    location: 'Sanitation store · Shelf B',
    expiryTracked: true,
  },
  {
    name: 'Alcohol hand sanitiser',
    category: 'Sanitation',
    unit: '500 mL bottle',
    location: 'Sanitation store · Shelf B',
    expiryTracked: true,
  },
  {
    name: 'Sterilising pouches',
    category: 'Sanitation',
    unit: 'pack of 100',
    location: 'Sterile services · Shelf A',
    expiryTracked: true,
  },
  {
    name: 'Amoxicillin capsules · 500 mg',
    category: 'Pharmaceuticals & vaccines',
    unit: 'box of 21',
    location: 'Medicines room · Locked shelf A',
    expiryTracked: true,
  },
  {
    name: 'Paracetamol tablets · 500 mg',
    category: 'Pharmaceuticals & vaccines',
    unit: 'box of 100',
    location: 'Medicines room · Locked shelf A',
    expiryTracked: true,
  },
  {
    name: 'Lidocaine injection · 2%',
    category: 'Pharmaceuticals & vaccines',
    unit: 'box of 10 vials',
    location: 'Medicines room · Locked shelf B',
    expiryTracked: true,
  },
  {
    name: 'Adrenaline injection · 1:1000',
    category: 'Pharmaceuticals & vaccines',
    unit: 'box of 10 ampoules',
    location: 'Emergency trolley · Drawer 1',
    expiryTracked: true,
  },
  {
    name: 'Insulin injection pens',
    category: 'Pharmaceuticals & vaccines',
    unit: 'box of 5 pens',
    location: 'Medicines room · Fridge 1',
    expiryTracked: true,
  },
  {
    name: 'Influenza vaccine',
    category: 'Pharmaceuticals & vaccines',
    unit: 'box of 10 doses',
    location: 'Medicines room · Fridge 1',
    expiryTracked: true,
  },
  {
    name: 'Travel vaccine',
    category: 'Pharmaceuticals & vaccines',
    unit: 'box of 10 doses',
    location: 'Medicines room · Fridge 1',
    expiryTracked: true,
  },
  {
    name: 'Stethoscopes',
    category: 'Reusable instruments',
    unit: 'each',
    location: 'Clinical equipment · Rack 1',
    expiryTracked: false,
  },
  {
    name: 'Adult blood pressure cuffs',
    category: 'Reusable instruments',
    unit: 'each',
    location: 'Clinical equipment · Rack 1',
    expiryTracked: false,
  },
  {
    name: 'Paediatric blood pressure cuffs',
    category: 'Reusable instruments',
    unit: 'each',
    location: 'Clinical equipment · Rack 1',
    expiryTracked: false,
  },
  {
    name: 'Otoscope sets',
    category: 'Reusable instruments',
    unit: 'set',
    location: 'Clinical equipment · Cabinet 1',
    expiryTracked: false,
  },
  {
    name: 'Surgical scissors',
    category: 'Reusable instruments',
    unit: 'each',
    location: 'Sterile services · Tray 1',
    expiryTracked: false,
  },
  {
    name: 'Procedure forceps',
    category: 'Reusable instruments',
    unit: 'each',
    location: 'Sterile services · Tray 1',
    expiryTracked: false,
  },
  {
    name: 'ECG machines',
    category: 'Capital equipment',
    unit: 'each',
    location: 'Diagnostics · Equipment bay',
    expiryTracked: false,
  },
  {
    name: 'Pulse oximeters',
    category: 'Capital equipment',
    unit: 'each',
    location: 'Diagnostics · Equipment bay',
    expiryTracked: false,
  },
  {
    name: 'Nebulisers',
    category: 'Capital equipment',
    unit: 'each',
    location: 'Treatment room · Equipment bay',
    expiryTracked: false,
  },
  {
    name: 'Examination tables',
    category: 'Capital equipment',
    unit: 'each',
    location: 'Facilities · Room 1',
    expiryTracked: false,
  },
  {
    name: 'Patient wheelchairs',
    category: 'Capital equipment',
    unit: 'each',
    location: 'Reception · Mobility bay',
    expiryTracked: false,
  },
  {
    name: 'Rolling supply carts',
    category: 'Capital equipment',
    unit: 'each',
    location: 'Equipment store · Bay 1',
    expiryTracked: false,
  },
  {
    name: 'Clinical-grade barrier cream',
    category: 'Specialty products',
    unit: 'tube',
    location: 'Patient care store · Shelf A',
    expiryTracked: true,
  },
  {
    name: 'Mineral sunscreen · SPF 50',
    category: 'Specialty products',
    unit: 'bottle',
    location: 'Patient care store · Shelf A',
    expiryTracked: true,
  },
  {
    name: 'Adult multivitamin supplements',
    category: 'Specialty products',
    unit: 'bottle',
    location: 'Patient care store · Shelf B',
    expiryTracked: true,
  },
];

export function productToInventoryItem(product: ApiProduct): InventoryItem {
  const catalogItem = clinicalCatalog[(product.id - 1) % clinicalCatalog.length];
  const now = product.meta?.updatedAt ?? new Date().toISOString();
  const reorderPoint = Math.max(5, Math.ceil((product.minimumOrderQuantity ?? 10) / 2));
  const expiresOn = catalogItem.expiryTracked
    ? new Date(Date.now() + (30 + (product.id % 330)) * 24 * 60 * 60 * 1000).toISOString()
    : null;

  return {
    id: String(product.id),
    sku: product.sku ?? `CLN-${String(product.id).padStart(4, '0')}`,
    name: catalogItem.name,
    category: catalogItem.category,
    unit: catalogItem.unit,
    onHand: product.stock,
    reorderPoint,
    targetLevel: Math.max(product.stock, reorderPoint * 3),
    location: catalogItem.location,
    supplier: 'Clinic procurement',
    expiresOn,
    lastCountedAt: now,
    lastCountedBy: 'System import',
    clinicId: 'clinic-northgate',
    sourceName: product.title,
    sourceCategory: product.category,
    sourceSupplier: product.brand,
  };
}

/** Apply the clinic-specific stock ledger to the shared catalogue item. */
export function applyClinicProfile(item: InventoryItem, clinicId: string): InventoryItem {
  if (clinicId === 'clinic-northgate') return { ...item, clinicId };

  const sourceId = Number(item.id);
  const stockFactor = 0.45 + ((sourceId * 7) % 9) / 20;
  const onHand = Math.max(0, Math.round(item.onHand * stockFactor));
  const reorderPoint = Math.max(3, Math.round(item.reorderPoint * (0.8 + (sourceId % 4) / 10)));

  return {
    ...item,
    clinicId,
    onHand,
    reorderPoint,
    targetLevel: Math.max(onHand, reorderPoint * 3),
    location: item.location.replace(/^[^·]+/, 'Riverside store'),
    supplier: 'Riverside clinical procurement',
  };
}

/** Keep a meaningful overlap while allowing each clinic to own different stock. */
export function isItemAvailableAtClinic(item: InventoryItem, clinicId: string): boolean {
  const sourceId = Number(item.id);
  if (!Number.isFinite(sourceId)) return true;
  if (clinicId === 'clinic-northgate') return sourceId % 7 !== 0;
  if (clinicId === 'clinic-riverside') return sourceId % 5 !== 0;
  return true;
}
