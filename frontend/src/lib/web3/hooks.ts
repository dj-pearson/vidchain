import { useAccount, useBalance, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';
import { activeChain, VIDCHAIN_CONTRACT_ADDRESS, VIDCHAIN_NFT_ABI } from './config';

/**
 * Hook for accessing wallet connection state and actions
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

/**
 * Hook for verifying a video by token ID
 */
export function useVerifyToken(tokenId: number | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VIDCHAIN_CONTRACT_ADDRESS,
    abi: VIDCHAIN_NFT_ABI,
    functionName: 'verify',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId !== undefined && !!VIDCHAIN_CONTRACT_ADDRESS,
    },
  });

  const result = data as
    | [string, string, bigint, string, boolean]
    | undefined;

  return {
    isLoading,
    error,
    refetch,
    data: result
      ? {
          sha256Hash: result[0],
          ipfsCidHash: result[1],
          timestamp: Number(result[2]),
          owner: result[3],
          exists: result[4],
        }
      : null,
  };
}

/**
 * Hook for verifying a video by hash
 */
export function useVerifyByHash(sha256Hash: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VIDCHAIN_CONTRACT_ADDRESS,
    abi: VIDCHAIN_NFT_ABI,
    functionName: 'verifyByHash',
    args: sha256Hash ? [sha256Hash] : undefined,
    query: {
      enabled: !!sha256Hash && !!VIDCHAIN_CONTRACT_ADDRESS,
    },
  });

  const result = data as [bigint, bigint, string, boolean] | undefined;

  return {
    isLoading,
    error,
    refetch,
    data: result
      ? {
          tokenId: Number(result[0]),
          timestamp: Number(result[1]),
          owner: result[2],
          exists: result[3],
        }
      : null,
  };
}

/**
 * Hook to check if a hash is already minted
 */
export function useIsHashMinted(sha256Hash: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VIDCHAIN_CONTRACT_ADDRESS,
    abi: VIDCHAIN_NFT_ABI,
    functionName: 'isHashMinted',
    args: sha256Hash ? [sha256Hash] : undefined,
    query: {
      enabled: !!sha256Hash && !!VIDCHAIN_CONTRACT_ADDRESS,
    },
  });

  return {
    isMinted: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting video record by token ID
 */
export function useVideoRecord(tokenId: number | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VIDCHAIN_CONTRACT_ADDRESS,
    abi: VIDCHAIN_NFT_ABI,
    functionName: 'videoRecords',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId !== undefined && !!VIDCHAIN_CONTRACT_ADDRESS,
    },
  });

  const result = data as [string, string, bigint, number] | undefined;

  return {
    isLoading,
    error,
    refetch,
    data: result
      ? {
          sha256Hash: result[0],
          ipfsCidHash: result[1],
          timestamp: Number(result[2]),
          version: result[3],
        }
      : null,
  };
}
