import { lazy, Suspense, type ReactNode } from 'react';

// Dynamically import the Web3Provider to split Web3 libraries into separate chunks
const Web3Provider = lazy(() =>
  import('./provider').then((m) => ({ default: m.Web3Provider }))
);

interface LazyWeb3ProviderProps {
  children: ReactNode;
}

/**
 * LazyWeb3Provider - Wraps children with Web3Provider loaded on demand
 * This splits RainbowKit, wagmi, viem, and wallet libraries into separate chunks
 * reducing initial page load time for users who don't need Web3 immediately
 */
export function LazyWeb3Provider({ children }: LazyWeb3ProviderProps) {
  return (
    <Suspense fallback={null}>
      <Web3Provider>{children}</Web3Provider>
    </Suspense>
  );
}
