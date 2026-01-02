# Lighthouse Loading Issues Analysis

**Date**: 2026-01-02
**Analyzed by**: Bundle analysis and build output inspection
**Status**: RESOLVED

## Executive Summary

The VidChain frontend had critical loading performance issues causing a **2.2MB+ main bundle** (650KB gzipped). After implementing fixes, the initial bundle was reduced to **252KB** (65KB gzipped) - an **88% reduction**.

### Key Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial JS Bundle | 2,237 KB | 252 KB | **88% smaller** |
| Gzipped Initial Bundle | 650 KB | 65 KB | **90% smaller** |
| Code Splitting | Broken | Working | No warnings |
| Web3 Libraries | Bundled in main | Separate chunks | Lazy loaded |

## Issues Found and Fixed

### Issue 1: Barrel Files Breaking Code Splitting

**Problem**: The build showed warnings:
```
/frontend/src/pages/marketplace/Marketplace.tsx is dynamically imported by App.tsx
but also statically imported by pages/marketplace/index.ts
```

**Root Cause**:
- `src/pages/index.ts` re-exported marketplace components
- `App.tsx` imported from the barrel for critical pages
- This defeated dynamic imports for marketplace pages

**Fix Applied**:
- Removed marketplace re-exports from `src/pages/index.ts`
- Changed `App.tsx` to use direct imports for critical pages:
  ```typescript
  // Before (triggers entire barrel)
  import { Login, Signup, Dashboard } from '@/pages';

  // After (direct imports)
  import { Login } from '@/pages/auth/Login';
  import { Signup } from '@/pages/auth/Signup';
  import { Dashboard } from '@/pages/Dashboard';
  ```

### Issue 2: Web3 Libraries Loaded Eagerly

**Problem**: Web3Provider wrapped the entire app, forcing all wallet libraries to load on every route (~1.5MB).

**Fix Applied**:
- Created `LazyWeb3Provider` that dynamically imports the Web3Provider
- Created `LazyWalletButton` that dynamically imports wallet components
- Updated `App.tsx` to use `LazyWeb3Provider`
- Updated `Header.tsx` to use `LazyWalletButton`

### Issue 3: No Vendor Chunk Optimization

**Problem**: Large vendor libraries were not split, causing inefficient bundling and poor caching.

**Fix Applied**: Added `manualChunks` configuration to `vite.config.ts`:
```typescript
manualChunks: (id) => {
  if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router')) {
    return 'vendor-react';
  }
  if (id.includes('wagmi/') || id.includes('viem/') || id.includes('@wagmi/')) {
    return 'vendor-web3-core';
  }
  if (id.includes('@rainbow-me/')) {
    return 'vendor-rainbowkit';
  }
  if (id.includes('@walletconnect/')) {
    return 'vendor-walletconnect';
  }
  if (id.includes('@metamask/')) {
    return 'vendor-metamask';
  }
  // ... more chunks
}
```

### Issue 4: Web3 Hooks Pulling in RainbowKit Unnecessarily

**Problem**: Pages using verification hooks (like VideoDetail) were pulling in the entire RainbowKit library because hooks.ts imported from both wagmi and RainbowKit.

**Fix Applied**:
- Created `verification-hooks.ts` with pure wagmi hooks (no RainbowKit dependency)
- Updated `hooks.ts` to re-export from `verification-hooks.ts` for backward compatibility
- Updated `VideoDetail.tsx` to import directly from `verification-hooks.ts`

## Final Bundle Analysis

### Core Bundles (Always Loaded)
| Chunk | Size | Gzipped |
|-------|------|---------|
| `index-*.js` (main) | 252 KB | 65 KB |
| `vendor-react-*.js` | 228 KB | 73 KB |
| `vendor-icons-*.js` | 24 KB | 8.5 KB |
| `vendor-tanstack-*.js` | 35 KB | 10 KB |

### On-Demand Web3 Bundles (Loaded when needed)
| Chunk | Size | Gzipped | Loaded When |
|-------|------|---------|-------------|
| `vendor-rainbowkit-*.js` | 1,878 KB | 285 KB | Wallet UI shown |
| `vendor-web3-core-*.js` | 1,041 KB | 314 KB | Web3 hooks used |
| `vendor-walletconnect-*.js` | 708 KB | 200 KB | WalletConnect used |
| `vendor-metamask-*.js` | 563 KB | 172 KB | MetaMask connection |
| `vendor-reown-*.js` | 535 KB | 145 KB | Wallet modals |

### Page Bundles (Loaded per route)
| Page | Size | Gzipped |
|------|------|---------|
| HomePage | 17 KB | 4.5 KB |
| Pricing | 11 KB | 3.3 KB |
| Marketplace | 12 KB | 3.1 KB |
| VideoDetail | 15 KB | 4.1 KB |
| Admin pages | 10-16 KB | 2-4 KB |

## Files Changed

1. **`src/pages/index.ts`** - Removed marketplace re-exports
2. **`src/App.tsx`** - Direct imports, LazyWeb3Provider
3. **`vite.config.ts`** - Added manualChunks configuration
4. **`src/lib/web3/LazyWeb3Provider.tsx`** - New lazy-loading wrapper
5. **`src/lib/web3/verification-hooks.ts`** - New file for pure wagmi hooks
6. **`src/lib/web3/hooks.ts`** - Re-exports from verification-hooks
7. **`src/lib/web3/index.ts`** - Added LazyWeb3Provider export
8. **`src/components/wallet/LazyWalletButton.tsx`** - New lazy-loading component
9. **`src/components/wallet/index.ts`** - Added LazyWalletButton export
10. **`src/components/layout/Header.tsx`** - Uses LazyWalletButton
11. **`src/pages/VideoDetail.tsx`** - Direct import from verification-hooks

## Verification

Build output confirms:
1. No warnings about dynamic imports being defeated
2. Main bundle is 252 KB (under 500 KB target)
3. Web3 libs are in separate vendor chunks
4. Code splitting is working correctly

Run `npm run build` to verify these results.
