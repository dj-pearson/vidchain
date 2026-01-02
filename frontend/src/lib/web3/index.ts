// Web3 configuration and utilities
export {
  wagmiConfig,
  activeChain,
  isMainnet,
  VIDCHAIN_CONTRACT_ADDRESS,
  VIDCHAIN_NFT_ABI,
} from './config';

// Web3 provider - use LazyWeb3Provider for better code splitting
export { Web3Provider } from './provider';
export { LazyWeb3Provider } from './LazyWeb3Provider';

// Hooks
export {
  useWallet,
  useVidChainNFT,
  useVerifyToken,
  useVerifyByHash,
  useIsHashMinted,
  useVideoRecord,
} from './hooks';
