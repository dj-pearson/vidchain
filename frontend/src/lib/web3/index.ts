// Web3 configuration and utilities
export {
  wagmiConfig,
  activeChain,
  isMainnet,
  VIDCHAIN_CONTRACT_ADDRESS,
  VIDCHAIN_NFT_ABI,
} from './config';

// Web3 provider
export { Web3Provider } from './provider';

// Hooks
export {
  useWallet,
  useVidChainNFT,
  useVerifyToken,
  useVerifyByHash,
  useIsHashMinted,
  useVideoRecord,
} from './hooks';
