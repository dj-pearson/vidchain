/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_POLYGON_NETWORK: 'mainnet' | 'amoy';
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_VIDCHAIN_CONTRACT_ADDRESS: string;
  readonly VITE_MUX_ENV_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
