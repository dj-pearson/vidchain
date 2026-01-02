import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - small, cached long-term
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }

          // Web3 core (wagmi, viem) - loaded for wallet pages
          if (id.includes('node_modules/wagmi/') ||
              id.includes('node_modules/viem/') ||
              id.includes('node_modules/@wagmi/')) {
            return 'vendor-web3-core';
          }

          // RainbowKit - wallet UI
          if (id.includes('node_modules/@rainbow-me/')) {
            return 'vendor-rainbowkit';
          }

          // WalletConnect - separate large dependency
          if (id.includes('node_modules/@walletconnect/')) {
            return 'vendor-walletconnect';
          }

          // MetaMask SDK - very large, separate chunk
          if (id.includes('node_modules/@metamask/')) {
            return 'vendor-metamask';
          }

          // Reown/AppKit - wallet modal and connectors
          if (id.includes('node_modules/@reown/')) {
            return 'vendor-reown';
          }

          // TanStack Query - state management
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-tanstack';
          }

          // UI libraries (lucide icons, etc)
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
})
