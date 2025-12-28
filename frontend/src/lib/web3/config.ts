import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { http } from 'wagmi';

// Get network from environment
const network = import.meta.env.VITE_POLYGON_NETWORK || 'amoy';
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// RPC URLs
const polygonMainnetRpc = alchemyApiKey
  ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
  : 'https://polygon-rpc.com';

const polygonAmoyRpc = alchemyApiKey
  ? `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`
  : 'https://rpc-amoy.polygon.technology';

// Chain configuration based on environment
const chains = network === 'mainnet'
  ? [polygon] as const
  : [polygonAmoy] as const;

// Configure wagmi with RainbowKit
export const wagmiConfig = getDefaultConfig({
  appName: 'VidChain',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'vidchain-demo',
  chains,
  transports: {
    [polygon.id]: http(polygonMainnetRpc),
    [polygonAmoy.id]: http(polygonAmoyRpc),
  },
  ssr: false,
});

// Export chain info for use throughout app
export const activeChain = network === 'mainnet' ? polygon : polygonAmoy;
export const isMainnet = network === 'mainnet';

// VidChainNFT contract address
export const VIDCHAIN_CONTRACT_ADDRESS =
  import.meta.env.VITE_VIDCHAIN_CONTRACT_ADDRESS as `0x${string}` | undefined;

// VidChainNFT ABI (minimal for frontend interactions)
export const VIDCHAIN_NFT_ABI = [
  // Read functions
  {
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    name: 'verify',
    outputs: [
      { name: 'sha256Hash', type: 'bytes32' },
      { name: 'ipfsCidHash', type: 'bytes32' },
      { name: 'timestamp', type: 'uint64' },
      { name: 'owner', type: 'address' },
      { name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_sha256Hash', type: 'bytes32' }],
    name: 'verifyByHash',
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'timestamp', type: 'uint64' },
      { name: 'owner', type: 'address' },
      { name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_sha256Hash', type: 'bytes32' }],
    name: 'isHashMinted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'videoRecords',
    outputs: [
      { name: 'sha256Hash', type: 'bytes32' },
      { name: 'ipfsCidHash', type: 'bytes32' },
      { name: 'timestamp', type: 'uint64' },
      { name: 'version', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'sha256Hash', type: 'bytes32' },
      { indexed: false, name: 'ipfsCidHash', type: 'bytes32' },
      { indexed: false, name: 'timestamp', type: 'uint64' },
    ],
    name: 'VideoAuthenticated',
    type: 'event',
  },
] as const;
