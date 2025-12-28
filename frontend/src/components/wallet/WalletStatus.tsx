import { useWallet } from '../../lib/web3/hooks';
import { cn } from '../../lib/utils';

interface WalletStatusProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * WalletStatus - Shows current wallet connection status and network info
 */
export function WalletStatus({ className, showDetails = false }: WalletStatusProps) {
  const {
    address,
    isConnected,
    isConnecting,
    balance,
    isWrongNetwork,
    activeChain,
    connect,
    switchToCorrectNetwork,
  } = useWallet();

  if (isConnecting) {
    return (
      <div className={cn('flex items-center gap-2 text-gray-500', className)}>
        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-2 w-2 rounded-full bg-gray-400" />
        <span className="text-sm text-gray-500">Not connected</span>
        <button
          onClick={connect}
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Connect
        </button>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-sm text-red-600">Wrong network</span>
        <button
          onClick={switchToCorrectNetwork}
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Switch to {activeChain.name}
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatAddress(address!)}
        </span>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {activeChain.name}
        </span>
      </div>
      {showDetails && balance && (
        <div className="ml-4 text-xs text-gray-500">{balance}</div>
      )}
    </div>
  );
}

/**
 * WalletIndicator - A minimal status indicator for the wallet
 */
export function WalletIndicator({ className }: { className?: string }) {
  const { isConnected, isWrongNetwork } = useWallet();

  const getStatusColor = () => {
    if (!isConnected) return 'bg-gray-400';
    if (isWrongNetwork) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getTooltip = () => {
    if (!isConnected) return 'Wallet not connected';
    if (isWrongNetwork) return 'Wrong network';
    return 'Wallet connected';
  };

  return (
    <div
      className={cn('h-2.5 w-2.5 rounded-full', getStatusColor(), className)}
      title={getTooltip()}
    />
  );
}

/**
 * Format an Ethereum address for display
 */
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
