// VidChain Configuration Constants

// Environment
export const IS_PRODUCTION = import.meta.env.PROD;
export const IS_DEVELOPMENT = import.meta.env.DEV;

// API URLs
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key-for-development';
export const HAS_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

// Blockchain Configuration
export const POLYGON_CHAIN_ID = import.meta.env.VITE_POLYGON_NETWORK === 'mainnet' ? 137 : 80001;
export const VIDCHAIN_CONTRACT_ADDRESS = import.meta.env.VITE_VIDCHAIN_CONTRACT_ADDRESS || '';
export const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// IPFS Configuration
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';
export const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

// Video Processing
export const MUX_TOKEN_ID = import.meta.env.VITE_MUX_TOKEN_ID || '';
// Note: MUX_TOKEN_SECRET should NEVER be exposed in frontend code
// It is handled securely on the server side only

// Upload Constraints
export const MAX_FILE_SIZE_MB = 500;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

// Verification
export const VERIFICATION_BADGE_SIZES = {
  small: 24,
  medium: 32,
  large: 48,
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    price: 199,
    verifications: 50,
    apiCallsPerDay: 1000,
    features: [
      'Basic API access',
      'Email support',
      'Verification badges',
    ],
  },
  professional: {
    name: 'Professional',
    price: 599,
    verifications: 250,
    apiCallsPerDay: 10000,
    features: [
      'Full API access',
      'Priority support',
      'CMS integrations',
      'Custom branding',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    verifications: null, // Unlimited
    apiCallsPerDay: null, // Unlimited
    features: [
      'Unlimited verifications',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'Training included',
      'Audit logs',
    ],
  },
  academic: {
    name: 'Academic/Nonprofit',
    price: 99,
    verifications: 250,
    apiCallsPerDay: 10000,
    features: [
      'Professional tier features',
      '50% discount',
      'For qualified organizations',
    ],
  },
} as const;

// Routes
export const ROUTES = {
  home: '/',
  howItWorks: '/how-it-works',
  pricing: '/pricing',
  dashboard: '/dashboard',
  upload: '/upload',
  videos: '/videos',
  video: (id: string) => `/videos/${id}`,
  verify: '/verify',
  verifyResult: (id: string) => `/verify/${id}`,
  settings: '/settings',
  apiKeys: '/settings/api-keys',
  billing: '/settings/billing',
  organization: '/settings/organization',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  // Marketplace routes
  marketplace: '/marketplace',
  nft: (id: string) => `/marketplace/${id}`,
  myListings: '/my-listings',
  createListing: '/create-listing',
  myOffers: '/my-offers',
  // Wallet/Token routes
  wallet: '/wallet',
  staking: '/staking',
  rewards: '/rewards',
  // Admin routes
  adminDashboard: '/admin',
  adminUsers: '/admin/users',
  adminUser: (id: string) => `/admin/users/${id}`,
  adminContent: '/admin/content',
  adminModeration: '/admin/moderation',
  adminMarketplace: '/admin/marketplace',
  adminFinance: '/admin/finance',
  adminTokens: '/admin/tokens',
  adminAnalytics: '/admin/analytics',
  adminAuditLogs: '/admin/audit-logs',
  adminSettings: '/admin/settings',
  // DMCA routes
  dmcaSubmit: '/dmca/submit',
  dmcaPolicy: '/dmca/policy',
  dmcaCounter: '/dmca/counter',
  dmcaMyClaims: '/dmca/my-claims',
} as const;

// Token Contract Addresses
export const VCT_CONTRACT_ADDRESS = import.meta.env.VITE_VCT_CONTRACT_ADDRESS || '';
export const VIDC_CONTRACT_ADDRESS = import.meta.env.VITE_VIDC_CONTRACT_ADDRESS || '';
export const MARKETPLACE_CONTRACT_ADDRESS = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '';

// Marketplace Configuration
export const MARKETPLACE_CONFIG = {
  platformFeeBps: 250, // 2.5%
  minListingPrice: '0.001', // ETH
  auctionDurations: [
    { label: '1 Hour', value: 3600 },
    { label: '6 Hours', value: 21600 },
    { label: '24 Hours', value: 86400 },
    { label: '3 Days', value: 259200 },
    { label: '7 Days', value: 604800 },
  ],
  offerDurations: [
    { label: '1 Hour', value: 3600 },
    { label: '24 Hours', value: 86400 },
    { label: '7 Days', value: 604800 },
    { label: '30 Days', value: 2592000 },
  ],
} as const;

// Upload Fee (VIDC)
export const UPLOAD_FEE_PER_10MB = 1; // 1 VIDC per 10MB

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    resetPassword: '/auth/reset-password',
  },
  videos: {
    list: '/videos',
    upload: '/videos/upload',
    get: (id: string) => `/videos/${id}`,
    delete: (id: string) => `/videos/${id}`,
  },
  verifications: {
    list: '/verifications',
    create: '/verifications',
    get: (id: string) => `/verifications/${id}`,
    byHash: (hash: string) => `/verifications/hash/${hash}`,
  },
  mint: {
    create: '/mint',
    status: (id: string) => `/mint/${id}/status`,
  },
  stats: '/stats',
} as const;
