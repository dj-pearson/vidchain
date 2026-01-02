import { lazy, Suspense } from 'react';

// Dynamically import WalletButton to split RainbowKit into a separate chunk
const WalletButton = lazy(() =>
  import('./WalletButton').then((m) => ({ default: m.WalletButton }))
);

interface LazyWalletButtonProps {
  className?: string;
  showBalance?: boolean;
  chainStatus?: 'full' | 'icon' | 'name' | 'none';
  accountStatus?: 'full' | 'avatar' | 'address';
}

/**
 * WalletButtonSkeleton - Loading placeholder for wallet button
 */
function WalletButtonSkeleton() {
  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
      <div className="h-4 w-4 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

/**
 * LazyWalletButton - Lazy-loaded wallet button that splits Web3 dependencies
 * from the main bundle for faster initial page loads
 */
export function LazyWalletButton({
  className,
  showBalance = true,
  chainStatus = 'icon',
  accountStatus = 'full',
}: LazyWalletButtonProps) {
  return (
    <Suspense fallback={<WalletButtonSkeleton />}>
      <WalletButton
        className={className}
        showBalance={showBalance}
        chainStatus={chainStatus}
        accountStatus={accountStatus}
      />
    </Suspense>
  );
}
