import React from 'react';
import { CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';
import { useInventory } from '../contexts/InventoryContext';

export function ConnectionToggle() {
  const { isOnline, setIsOnline, isSyncing, pendingCount } = useInventory();

  return (
    <div className="flex items-center gap-2">
      {pendingCount > 0 && (
        <span
          className={cn(
            'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex',
            isSyncing ? 'status-ok' : 'status-low',
          )}
        >
          <RefreshCw className={cn('size-3.5', isSyncing && 'animate-spin')} />
          {isSyncing ? 'Syncing…' : `${pendingCount} waiting to sync`}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOnline(!isOnline)}
        aria-pressed={!isOnline}
        title="Simulate the ward wifi dropping"
      >
        {isOnline ? (
          <>
            <Wifi className="size-4 text-good" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="size-4 text-warn" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
      </Button>
    </div>
  );
}

export function OfflineBanner() {
  const { isOnline, pendingCount } = useInventory();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="status-low flex items-start gap-3 border-b px-4 py-2.5 text-sm sm:px-6"
    >
      <CloudOff className="mt-0.5 size-4 shrink-0" />
      <p className="text-foreground">
        <span className="font-medium">No connection.</span>{' '}
        <span className="text-muted-foreground">
          You can keep counting — corrections are saved on this tablet
          {pendingCount > 0 ? ` (${pendingCount} waiting)` : ''} and sync automatically.
        </span>
      </p>
    </div>
  );
}

export function PendingSyncTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'status-low inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      <CloudOff className="size-3" />
      Not synced
    </span>
  );
}
