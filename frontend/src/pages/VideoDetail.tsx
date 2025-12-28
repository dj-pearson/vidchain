import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { VideoPlayer } from '@/components/video';
import { useVerifyToken, useVideoRecord } from '@/lib/web3';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Share2,
  Download,
  Code,
  Shield,
  Link as LinkIcon,
  Calendar,
  Hash,
  User,
  Globe,
} from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  storage_url: string;
  mux_playback_id?: string;
  thumbnail_url?: string;
  duration?: number;
  sha256_hash?: string;
  ipfs_cid?: string;
  status: string;
  created_at: string;
  user_id: string;
  organization_id: string;
  verification?: {
    id: string;
    token_id?: number;
    transaction_hash?: string;
    status: string;
    blockchain_timestamp?: string;
  };
}

export function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Blockchain verification data
  const tokenId = video?.verification?.token_id;
  const { data: onChainData, isLoading: isVerifying } = useVerifyToken(tokenId);
  const { data: videoRecord } = useVideoRecord(tokenId);

  useEffect(() => {
    async function fetchVideo() {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('videos')
          .select(`
            *,
            verification:verifications(*)
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setVideo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const getVerificationStatus = () => {
    if (!video?.verification) return 'unverified';
    if (video.verification.status === 'completed' && onChainData?.exists) {
      return 'verified';
    }
    if (video.verification.status === 'pending' || video.verification.status === 'processing') {
      return 'pending';
    }
    return 'unverified';
  };

  const status = getVerificationStatus();

  const getStatusBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="success" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Verified on Blockchain
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Verification Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Not Verified
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Video Not Found</h2>
            <p className="mt-2 text-muted-foreground">{error || 'The requested video could not be found.'}</p>
            <Link to="/videos">
              <Button className="mt-6">Back to Videos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const polygonExplorerUrl = import.meta.env.VITE_POLYGON_NETWORK === 'mainnet'
    ? 'https://polygonscan.com'
    : 'https://amoy.polygonscan.com';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="overflow-hidden rounded-xl bg-black">
            <VideoPlayer
              playbackId={video.mux_playback_id}
              src={!video.mux_playback_id ? video.storage_url : undefined}
              poster={video.thumbnail_url}
              title={video.title}
              showVerificationBadge={true}
              verificationStatus={status}
            />
          </div>

          {/* Video Info */}
          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{video.title}</h1>
                <div className="mt-2 flex items-center gap-3">
                  {getStatusBadge()}
                  <span className="text-sm text-muted-foreground">
                    <Calendar className="mr-1 inline h-4 w-4" />
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                  {video.duration && (
                    <span className="text-sm text-muted-foreground">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Code className="mr-2 h-4 w-4" />
                  Embed
                </Button>
              </div>
            </div>

            {video.description && (
              <p className="mt-4 text-muted-foreground">{video.description}</p>
            )}
          </div>

          {/* Verification Details Card */}
          {status === 'verified' && video.verification && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Shield className="h-5 w-5" />
                  Blockchain Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Token ID */}
                  {video.verification.token_id && (
                    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Token ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-background px-2 py-1 text-sm">
                          #{video.verification.token_id}
                        </code>
                      </div>
                    </div>
                  )}

                  {/* Transaction Hash */}
                  {video.verification.transaction_hash && (
                    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Transaction</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-background px-2 py-1 text-sm">
                          {video.verification.transaction_hash.slice(0, 10)}...
                          {video.verification.transaction_hash.slice(-8)}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(video.verification!.transaction_hash!, 'tx')
                          }
                          className="p-1 hover:bg-background rounded"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`${polygonExplorerUrl}/tx/${video.verification.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-background rounded"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Owner Address */}
                  {onChainData?.owner && (
                    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Owner</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-background px-2 py-1 text-sm">
                          {onChainData.owner.slice(0, 6)}...{onChainData.owner.slice(-4)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(onChainData.owner, 'owner')}
                          className="p-1 hover:bg-background rounded"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`${polygonExplorerUrl}/address/${onChainData.owner}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-background rounded"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Blockchain Timestamp */}
                  {onChainData?.timestamp && (
                    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Verified On</span>
                      </div>
                      <span className="text-sm">
                        {new Date(onChainData.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Globe className="mr-2 h-4 w-4" />
                View on IPFS
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Code className="mr-2 h-4 w-4" />
                Get Embed Code
              </Button>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SHA-256 Hash */}
              {video.sha256_hash && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    SHA-256 Hash
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                      {video.sha256_hash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(video.sha256_hash!, 'hash')}
                      className="p-1 hover:bg-muted rounded"
                      title={copied === 'hash' ? 'Copied!' : 'Copy'}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* IPFS CID */}
              {video.ipfs_cid && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    IPFS CID
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                      {video.ipfs_cid}
                    </code>
                    <button
                      onClick={() => copyToClipboard(video.ipfs_cid!, 'cid')}
                      className="p-1 hover:bg-muted rounded"
                      title={copied === 'cid' ? 'Copied!' : 'Copy'}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${video.ipfs_cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-muted rounded"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Video ID */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Video ID
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                    {video.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(video.id, 'id')}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Timeline */}
          {video.verification && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4 pl-6">
                  <div className="absolute left-2 top-2 h-[calc(100%-16px)] w-px bg-border" />

                  <div className="relative">
                    <div className="absolute -left-4 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm font-medium">Video Uploaded</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(video.created_at).toLocaleString()}
                    </p>
                  </div>

                  {video.sha256_hash && (
                    <div className="relative">
                      <div className="absolute -left-4 h-3 w-3 rounded-full bg-primary" />
                      <p className="text-sm font-medium">Hash Computed</p>
                      <p className="text-xs text-muted-foreground">SHA-256 fingerprint generated</p>
                    </div>
                  )}

                  {video.ipfs_cid && (
                    <div className="relative">
                      <div className="absolute -left-4 h-3 w-3 rounded-full bg-primary" />
                      <p className="text-sm font-medium">Stored on IPFS</p>
                      <p className="text-xs text-muted-foreground">Decentralized storage complete</p>
                    </div>
                  )}

                  {status === 'verified' && (
                    <div className="relative">
                      <div className="absolute -left-4 h-3 w-3 rounded-full bg-green-500" />
                      <p className="text-sm font-medium text-green-600">NFT Minted</p>
                      <p className="text-xs text-muted-foreground">
                        {video.verification.blockchain_timestamp
                          ? new Date(video.verification.blockchain_timestamp).toLocaleString()
                          : 'On Polygon blockchain'}
                      </p>
                    </div>
                  )}

                  {status === 'pending' && (
                    <div className="relative">
                      <div className="absolute -left-4 h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
                      <p className="text-sm font-medium text-yellow-600">Minting in Progress</p>
                      <p className="text-xs text-muted-foreground">Please wait...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
