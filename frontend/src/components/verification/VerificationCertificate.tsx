import { cn } from '@/lib/utils';
import { Shield, CheckCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface VerificationCertificateProps {
  tokenId: number;
  title?: string;
  sha256Hash: string;
  ipfsCid?: string;
  transactionHash: string;
  ownerAddress: string;
  timestamp: string;
  network?: 'polygon' | 'amoy';
  className?: string;
}

/**
 * VerificationCertificate - A full certificate display for verified videos
 * Can be embedded on news sites or shared as a standalone verification
 */
export function VerificationCertificate({
  tokenId,
  title,
  sha256Hash,
  ipfsCid,
  transactionHash,
  ownerAddress,
  timestamp,
  network = 'polygon',
  className,
}: VerificationCertificateProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const explorerUrl = network === 'polygon'
    ? 'https://polygonscan.com'
    : 'https://amoy.polygonscan.com';

  const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900',
        'shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="bg-green-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">VidChain Certificate</h3>
              <p className="text-sm text-green-100">Blockchain Verified Content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {title && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Video Title
            </label>
            <p className="mt-1 font-semibold text-lg">{title}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Token ID */}
          <div className="rounded-lg bg-muted/50 p-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Token ID
            </label>
            <p className="mt-1 font-mono text-xl font-bold text-green-600">
              #{tokenId}
            </p>
          </div>

          {/* Verification Date */}
          <div className="rounded-lg bg-muted/50 p-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Verified On
            </label>
            <p className="mt-1 font-medium">
              {new Date(timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* SHA-256 Hash */}
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              SHA-256 Hash
            </label>
            <button
              onClick={() => copyToClipboard(sha256Hash, 'hash')}
              className="text-xs text-primary hover:underline"
            >
              {copied === 'hash' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
            {sha256Hash}
          </p>
        </div>

        {/* Transaction Hash */}
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Transaction Hash
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(transactionHash, 'tx')}
                className="text-xs text-primary hover:underline"
              >
                {copied === 'tx' ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={`${explorerUrl}/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
            {transactionHash}
          </p>
        </div>

        {/* Owner Address */}
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Owner Address
            </label>
            <a
              href={`${explorerUrl}/address/${ownerAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
            {ownerAddress}
          </p>
        </div>

        {/* IPFS Link */}
        {ipfsCid && (
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                IPFS CID
              </label>
              <a
                href={`${ipfsGateway}${ipfsCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on IPFS <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
              {ipfsCid}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Powered by VidChain</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Network: {network === 'polygon' ? 'Polygon Mainnet' : 'Polygon Amoy Testnet'}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact verification certificate for inline embedding
 */
export function CompactCertificate({
  tokenId,
  status,
  timestamp,
  className,
}: {
  tokenId: number;
  status: 'verified' | 'pending' | 'unverified';
  timestamp?: string;
  className?: string;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vidchain.io';

  return (
    <a
      href={`${baseUrl}/verify/${tokenId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-md',
        status === 'verified' && 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
        status === 'pending' && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
        status === 'unverified' && 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
        className
      )}
    >
      <div className={cn(
        'rounded-full p-2',
        status === 'verified' && 'bg-green-100 text-green-600 dark:bg-green-900',
        status === 'pending' && 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900',
        status === 'unverified' && 'bg-red-100 text-red-600 dark:bg-red-900'
      )}>
        <Shield className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {status === 'verified' && 'Blockchain Verified'}
            {status === 'pending' && 'Verification Pending'}
            {status === 'unverified' && 'Not Verified'}
          </span>
          {status === 'verified' && <CheckCircle className="h-4 w-4 text-green-600" />}
        </div>
        <p className="text-xs text-muted-foreground">
          Token #{tokenId}
          {timestamp && ` • ${new Date(timestamp).toLocaleDateString()}`}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}
