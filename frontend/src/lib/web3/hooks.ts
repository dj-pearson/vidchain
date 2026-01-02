/**
 * Wallet-related hooks that require RainbowKit
 * For verification-only hooks (that don't need RainbowKit), import from './verification-hooks'
 */
import { useAccount, useBalance, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';
import { activeChain, VIDCHAIN_CONTRACT_ADDRESS, VIDCHAIN_NFT_ABI } from './config';

// Re-export verification hooks for backward compatibility
// For better code splitting, import directly from './verification-hooks'
export {
  useVerifyToken,
  useVerifyByHash,
  useIsHashMinted,
  useVideoRecord,
} from './verification-hooks';

/**
 * Hook for accessing wallet connection state and actions
 * This hook requires RainbowKit to be loaded
 */
export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();

  const { data: balance } = useBalance({
    address,
    chainId: activeChain.id,
  });

  const isWrongNetwork = isConnected && chainId !== activeChain.id;

  const switchToCorrectNetwork = async () => {
    if (switchChain) {
      await switchChain({ chainId: activeChain.id });
    }
  };

  const formattedBalance = balance
    ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}`
    : undefined;

  return {
    // State
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
    balance: formattedBalance,
    balanceRaw: balance,
    connector,
    isWrongNetwork,
    isSwitchingChain,
    activeChain,

    // Actions
    connect: openConnectModal,
    openAccount: openAccountModal,
    openChainModal,
    switchToCorrectNetwork,
  };
}

/**
 * Hook for reading VidChainNFT contract data
 */
export function useVidChainNFT() {
  const { address, isConnected } = useAccount();

  // Get total supply
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: VIDCHAIN_CONTRACT_ADDRESS,
    abi: VIDCHAIN_NFT_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!VIDCHAIN_CONTRACT_ADDRESS,
    },
  });

  return {
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    refetchTotalSupply,
    isContractConfigured: !!VIDCHAIN_CONTRACT_ADDRESS,
    userAddress: address,
    isConnected,
  };
}
