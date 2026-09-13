import React, { useEffect, useRef, useState } from 'react';
import { Boxes, ChevronDown, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { ConnectionToggle, OfflineBanner } from './SyncStatus';
import { useInventory } from '../contexts/InventoryContext';
import { clinics } from '../data/inventory';
import { cn } from '../utils/cn';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { clinicId, setClinicId, user, logout } = useInventory();
  const clinic = clinics.find((c) => c.id === clinicId) ?? clinics[0];
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;

  return (
    <div className="clinic-app flex min-h-screen w-full flex-col bg-page text-foreground">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] w-full max-w-[1500px] items-center gap-5 px-4 sm:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
              <Boxes className="size-5" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[15px] font-semibold tracking-tight text-slate-950">
                Clinic Stock Console
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">Inventory management</span>
            </span>
          </Link>
          <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <ClinicSwitcher clinicId={clinicId} onClinicChange={setClinicId} />

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <ConnectionToggle />
            <div className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right leading-tight">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Supplies team</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700">
                {initials}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="px-1.5 text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </Button>
          </div>
        </div>
        <OfflineBanner />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            <span className="font-medium text-slate-900">Clinic Stock Console</span>
            <span className="mx-2 text-slate-300">•</span>
            {clinic.name} branch<span className="mx-2 text-slate-300">•</span>
          </p>
          <p className="flex gap-4">
            <span>Compliance log</span>
            <span>Audit history</span>
            <span className="hidden sm:inline">Central clinic registry</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function ClinicSwitcher({
  clinicId,
  onClinicChange,
}: {
  clinicId: string;
  onClinicChange: (clinicId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clinic = clinics.find((candidate) => candidate.id === clinicId) ?? clinics[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex h-10 max-w-[260px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="truncate">{clinic.name}</span>
        <ChevronDown
          className={cn('size-3.5 text-slate-500 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Switch clinic"
          className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-sm text-slate-900 shadow-xl shadow-slate-900/10"
        >
          <p className="px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Switch clinic
          </p>
          {clinics.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-100',
                candidate.id === clinic.id && 'bg-slate-50 font-medium',
              )}
              onClick={() => {
                onClinicChange(candidate.id);
                setOpen(false);
              }}
            >
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              {candidate.name}
            </button>
          ))}
          <p className="mt-1 border-t border-slate-100 px-2.5 pb-1 pt-2 text-xs text-slate-400">
            More clinics join as they roll out.
          </p>
        </div>
      )}
    </div>
  );
}
