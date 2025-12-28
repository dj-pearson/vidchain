import { useState } from 'react';
import { usePublicVerification } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { AlertWithIcon } from '@/components/ui/Alert';
import {
  truncateHash,
  formatDateTime,
  getIpfsUrl,
  getExplorerUrl,
  getStatusBadgeVariant,
} from '@/lib/utils';
import {
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  FileVideo,
  Clock,
  User,
  Link as LinkIcon,
} from 'lucide-react';

export function Verify() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data: result,
    isLoading,
    error,
    isFetched,
  } = usePublicVerification(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <Shield className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 text-3xl font-bold">Verify Video Authenticity</h1>
        <p className="mt-2 text-muted-foreground">
          Enter a token ID, transaction hash, or video hash to verify authenticity
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Token ID, transaction hash, or SHA-256 hash"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={!query.trim() || isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && <LoadingState message="Verifying video..." />}

      {/* Error State */}
      {error && (
        <AlertWithIcon variant="destructive" title="Verification Error">
          {error instanceof Error ? error.message : 'Failed to verify video'}
        </AlertWithIcon>
      )}

      {/* Results */}
      {isFetched && !isLoading && !error && result && (
        <VerificationResult result={result} onCopy={copyToClipboard} />
      )}

      {/* No Result */}
      {isFetched && !isLoading && !error && !result && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <XCircle className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Verification Found</h2>
            <p className="mt-2 text-center text-muted-foreground">
              No verification record found for this query.
              <br />
              The video may not be registered on VidChain.
            </p>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      {!isFetched && (
        <Card>
          <CardHeader>
            <CardTitle>How Verification Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="font-medium">Hash Verification</h3>
                <p className="text-sm text-muted-foreground">
                  We compare the video's SHA-256 hash with the blockchain record
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="font-medium">Blockchain Timestamp</h3>
                <p className="text-sm text-muted-foreground">
                  The exact time of verification is immutably recorded
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="font-medium">IPFS Storage</h3>
                <p className="text-sm text-muted-foreground">
                  The original video is stored on decentralized IPFS network
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface VerificationResultProps {
  result: {
    status: 'verified' | 'unverified' | 'modified' | 'unknown';
    confidence: number;
    token_id?: number;
    sha256_hash: string;
    ipfs_cid: string;
    blockchain_timestamp?: string;
    transaction_hash?: string;
    owner_address?: string;
    checks: {
      hash_match: boolean;
      cid_valid: boolean;
      chain_unbroken: boolean;
      metadata_consistent: boolean;
    };
    warnings: string[];
    certificate_url?: string;
  };
  onCopy: (text: string) => Promise<void>;
}

function VerificationResult({ result, onCopy }: VerificationResultProps) {
  const isVerified = result.status === 'verified';

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={isVerified ? 'border-success' : 'border-destructive'}>
        <CardContent className="flex items-center gap-4 py-6">
          {isVerified ? (
            <CheckCircle className="h-12 w-12 text-success" />
          ) : (
            <XCircle className="h-12 w-12 text-destructive" />
          )}
          <div>
            <h2 className="text-2xl font-bold">
              {isVerified ? 'Video Verified' : 'Verification Failed'}
            </h2>
            <p className="text-muted-foreground">
              Confidence: {result.confidence}%
            </p>
          </div>
          <Badge
            variant={getStatusBadgeVariant(result.status)}
            className="ml-auto text-lg px-4 py-1"
          >
            {result.status.toUpperCase()}
          </Badge>
        </CardContent>
      </Card>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <AlertWithIcon variant="warning" title="Warnings">
          <ul className="list-disc pl-4">
            {result.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </AlertWithIcon>
      )}

      {/* Verification Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckItem passed={result.checks.hash_match} label="SHA-256 hash matches blockchain record" />
          <CheckItem passed={result.checks.cid_valid} label="IPFS content is accessible" />
          <CheckItem passed={result.checks.chain_unbroken} label="Chain of custody unbroken" />
          <CheckItem passed={result.checks.metadata_consistent} label="Metadata is consistent" />
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.token_id && (
            <DetailRow
              icon={<FileVideo className="h-4 w-4" />}
              label="Token ID"
              value={`#${result.token_id}`}
            />
          )}

          <DetailRow
            icon={<Shield className="h-4 w-4" />}
            label="SHA-256 Hash"
            value={truncateHash(result.sha256_hash, 12, 8)}
            fullValue={result.sha256_hash}
            onCopy={() => onCopy(result.sha256_hash)}
          />

          <DetailRow
            icon={<LinkIcon className="h-4 w-4" />}
            label="IPFS CID"
            value={truncateHash(result.ipfs_cid, 12, 8)}
            fullValue={result.ipfs_cid}
            href={getIpfsUrl(result.ipfs_cid)}
            onCopy={() => onCopy(result.ipfs_cid)}
          />

          {result.blockchain_timestamp && (
            <DetailRow
              icon={<Clock className="h-4 w-4" />}
              label="Verified At"
              value={formatDateTime(result.blockchain_timestamp)}
            />
          )}

          {result.transaction_hash && (
            <DetailRow
              icon={<ExternalLink className="h-4 w-4" />}
              label="Transaction"
              value={truncateHash(result.transaction_hash, 10, 6)}
              fullValue={result.transaction_hash}
              href={getExplorerUrl(result.transaction_hash)}
              onCopy={() => onCopy(result.transaction_hash!)}
            />
          )}

          {result.owner_address && (
            <DetailRow
              icon={<User className="h-4 w-4" />}
              label="Owner"
              value={truncateHash(result.owner_address, 8, 6)}
              fullValue={result.owner_address}
              href={getExplorerUrl(result.owner_address, 'address')}
              onCopy={() => onCopy(result.owner_address!)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CheckItem({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {passed ? (
        <CheckCircle className="h-5 w-5 text-success" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
      <span className={passed ? '' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullValue?: string;
  href?: string;
  onCopy?: () => void;
}

function DetailRow({ icon, label, value, fullValue, href, onCopy }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm hover:underline"
            title={fullValue}
          >
            {value}
            <ExternalLink className="ml-1 inline h-3 w-3" />
          </a>
        ) : (
          <span className="font-mono text-sm" title={fullValue}>
            {value}
          </span>
        )}
        {onCopy && (
          <button
            onClick={onCopy}
            className="rounded p-1 hover:bg-accent"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
