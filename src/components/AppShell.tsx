import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'./ui/DropdownMenu';
import { Button } from './ui/Button';
import { ConnectionToggle, OfflineBanner } from './SyncStatus';
import { useInventory } from '../contexts/InventoryContext';
import { clinics } from '../data/inventory';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { clinicId, setClinicId, user, logout } = useInventory();
  const clinic = clinics.find((c) => c.id === clinicId) ?? clinics[0];

  return (
    <div className="flex min-h-screen w-full flex-col bg-page text-foreground">
      <header className="sticky top-0 z-30 border-b hairline bg-card">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Boxes className="size-[18px]" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold">Supply Console</span>
              <span className="block text-xs text-muted-foreground">Inventory</span>
            </span>
          </Link>

          <span className="mx-1 hidden h-6 w-px bg-hairline sm:block" aria-hidden="true" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
                <span className="max-w-[10rem] truncate">{clinic.name}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel>Clinic</DropdownMenuLabel>
              {clinics.map((c) =>
              <DropdownMenuItem key={c.id} onClick={() => setClinicId(c.id)}>
                  {c.name}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                More clinics join as they roll out.
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-3">
            <ConnectionToggle />
            <div className="hidden items-center gap-2.5 border-l hairline pl-3 md:flex">
              <div className="text-right leading-tight">
                <p className="text-xs font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">Supplies team</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                AO
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
            </div>
          </div>
        </div>
        <OfflineBanner />
      </header>
      <main className="flex-1">{children}</main>
    </div>);

}
