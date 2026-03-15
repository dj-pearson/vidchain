import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerificationBadge } from '@/components/verification';
import { cn } from '@/lib/utils';
import { Copy, Check, Code, Eye, Settings, Palette, QrCode, Globe, Share2 } from 'lucide-react';

type EmbedType = 'badge' | 'player' | 'certificate' | 'qrcode' | 'jsonld';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'default' | 'minimal' | 'detailed';
type Theme = 'light' | 'dark' | 'auto';
type CodeFormat = 'html' | 'react' | 'wordpress' | 'markdown';

interface EmbedOptions {
  type: EmbedType;
  size: BadgeSize;
  variant: BadgeVariant;
  theme: Theme;
  showLink: boolean;
  width?: string;
  height?: string;
  codeFormat: CodeFormat;
}

interface EmbedGeneratorProps {
  tokenId: number;
  videoId: string;
  status: 'verified' | 'pending' | 'unverified';
  playbackId?: string;
  videoTitle?: string;
  verificationDate?: string;
  transactionHash?: string;
  className?: string;
}

/**
 * EmbedGenerator - Generate embed codes for verification badges, players, QR codes, and structured data
 */
export function EmbedGenerator({
  tokenId,
  videoId: _videoId,
  status,
  playbackId,
  videoTitle,
  verificationDate,
  transactionHash,
  className,
}: EmbedGeneratorProps) {
  const [options, setOptions] = useState<EmbedOptions>({
    type: 'badge',
    size: 'md',
    variant: 'default',
    theme: 'auto',
    showLink: true,
    width: '100%',
    height: '400px',
    codeFormat: 'html',
  });
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vidchain.io';

  // Generate QR code SVG (simple implementation using a placeholder API)
  const qrCodeUrl = useMemo(() => {
    const verifyUrl = `${baseUrl}/verify/${tokenId}`;
    return `${baseUrl}/api/qr/${tokenId}?url=${encodeURIComponent(verifyUrl)}&size=200`;
  }, [baseUrl, tokenId]);

  // Generate JSON-LD structured data
  const jsonLdData = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: videoTitle || `Verified Video #${tokenId}`,
      identifier: tokenId,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'verificationStatus',
          value: status,
        },
        {
          '@type': 'PropertyValue',
          name: 'blockchainNetwork',
          value: 'Polygon',
        },
        ...(transactionHash ? [{
          '@type': 'PropertyValue',
          name: 'transactionHash',
          value: transactionHash,
        }] : []),
        ...(verificationDate ? [{
          '@type': 'PropertyValue',
          name: 'verificationDate',
          value: verificationDate,
        }] : []),
      ],
      potentialAction: {
        '@type': 'ViewAction',
        name: 'Verify Authenticity',
        target: `${baseUrl}/verify/${tokenId}`,
      },
    }, null, 2);
  }, [tokenId, status, videoTitle, transactionHash, verificationDate, baseUrl]);

  // Generate embed code based on options
  const embedCode = useMemo(() => {
    const { type, size, variant, theme, showLink, width, height, codeFormat } = options;

    if (type === 'badge') {
      if (codeFormat === 'react') {
        return `import { VerificationBadge } from '@vidchain/react';

<VerificationBadge
  tokenId={${tokenId}}
  size="${size}"
  variant="${variant}"
  theme="${theme}"
  showLink={${showLink}}
/>`;
      }

      if (codeFormat === 'wordpress') {
        return `[vidchain_badge token_id="${tokenId}" size="${size}" variant="${variant}" theme="${theme}"]`;
      }

      if (codeFormat === 'markdown') {
        return `[![VidChain Verified](${baseUrl}/api/badge/${tokenId}.svg?variant=${variant}&size=${size})](${baseUrl}/verify/${tokenId})`;
      }

      // Default HTML embed
      return `<!-- VidChain Verification Badge -->
<div id="vidchain-badge-${tokenId}"></div>
<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/embed/badge.js';
  script.async = true;
  script.onload = function() {
    VidChainBadge.render({
      tokenId: ${tokenId},
      container: '#vidchain-badge-${tokenId}',
      size: '${size}',
      variant: '${variant}',
      theme: '${theme}',
      showLink: ${showLink}
    });
  };
  document.head.appendChild(script);
})();
</script>`;
    }

    if (type === 'player') {
      const params = new URLSearchParams({
        token: tokenId.toString(),
        theme,
        showBadge: 'true',
      });
      if (playbackId) {
        params.set('playbackId', playbackId);
      }

      return `<!-- VidChain Verified Video Player -->
<iframe
  src="${baseUrl}/embed/player?${params.toString()}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  title="VidChain Verified Video"
></iframe>`;
    }

    if (type === 'certificate') {
      return `<!-- VidChain Verification Certificate -->
<iframe
  src="${baseUrl}/embed/certificate/${tokenId}?theme=${theme}"
  width="${width}"
  height="auto"
  frameborder="0"
  scrolling="no"
  title="VidChain Verification Certificate"
></iframe>`;
    }

    if (type === 'qrcode') {
      return `<!-- VidChain QR Code -->
<a href="${baseUrl}/verify/${tokenId}" target="_blank" rel="noopener noreferrer">
  <img
    src="${qrCodeUrl}"
    alt="Scan to verify - VidChain Token #${tokenId}"
    width="200"
    height="200"
  />
</a>`;
    }

    if (type === 'jsonld') {
      return `<!-- VidChain Structured Data (JSON-LD) - Add to <head> -->
<script type="application/ld+json">
${jsonLdData}
</script>`;
    }

    return '';
  }, [options, tokenId, playbackId, baseUrl, qrCodeUrl, jsonLdData]);

  // Generate HTML snippet for simple integration
  const htmlSnippet = useMemo(() => {
    if (options.type === 'badge') {
      return `<a href="${baseUrl}/verify/${tokenId}"
   target="_blank"
   rel="noopener noreferrer"
   class="vidchain-badge vidchain-badge--${options.variant} vidchain-badge--${options.size}">
  <img src="${baseUrl}/api/badge/${tokenId}.svg?variant=${options.variant}&size=${options.size}"
       alt="VidChain Verified" />
</a>`;
    }
    return embedCode;
  }, [options, tokenId, embedCode, baseUrl]);

  const copyToClipboard = (text?: string) => {
    navigator.clipboard.writeText(text || embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'code', label: 'Code', icon: Code },
  ] as const;

  const embedTypes = [
    { id: 'badge', label: 'Badge', description: 'Compact verification indicator', icon: Share2 },
    { id: 'player', label: 'Player', description: 'Video player with verification', icon: Eye },
    { id: 'certificate', label: 'Certificate', description: 'Full verification certificate', icon: Globe },
    { id: 'qrcode', label: 'QR Code', description: 'Scannable verification link', icon: QrCode },
    { id: 'jsonld', label: 'SEO Data', description: 'JSON-LD structured data', icon: Code },
  ] as const;

  const codeFormats = [
    { id: 'html', label: 'HTML' },
    { id: 'react', label: 'React' },
    { id: 'wordpress', label: 'WordPress' },
    { id: 'markdown', label: 'Markdown' },
  ] as const;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Embed Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Embed Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {embedTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setOptions((o) => ({ ...o, type: type.id }))}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-all',
                    options.type === type.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="h-5 w-5 mb-2 text-muted-foreground" />
                  <h4 className="font-medium">{type.label}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customization Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Customize
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Code Format (for badges) */}
            {options.type === 'badge' && (
              <div>
                <label className="text-sm font-medium">Format</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {codeFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setOptions((o) => ({ ...o, codeFormat: format.id }))}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-sm',
                        options.codeFormat === format.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size (for badges) */}
            {options.type === 'badge' && (
              <div>
                <label className="text-sm font-medium">Size</label>
                <div className="mt-2 flex gap-2">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setOptions((o) => ({ ...o, size }))}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-sm',
                        options.size === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variant (for badges) */}
            {options.type === 'badge' && (
              <div>
                <label className="text-sm font-medium">Style</label>
                <div className="mt-2 flex gap-2">
                  {(['minimal', 'default', 'detailed'] as const).map((variant) => (
                    <button
                      key={variant}
                      onClick={() => setOptions((o) => ({ ...o, variant }))}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-sm capitalize',
                        options.variant === variant
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Theme */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme
              </label>
              <div className="mt-2 flex gap-2">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setOptions((o) => ({ ...o, theme }))}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-sm capitalize',
                      options.theme === theme
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    )}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions (for player/certificate) */}
            {(options.type === 'player' || options.type === 'certificate') && (
              <>
                <div>
                  <label className="text-sm font-medium">Width</label>
                  <Input
                    value={options.width}
                    onChange={(e) => setOptions((o) => ({ ...o, width: e.target.value }))}
                    placeholder="100%"
                    className="mt-2"
                  />
                </div>
                {options.type === 'player' && (
                  <div>
                    <label className="text-sm font-medium">Height</label>
                    <Input
                      value={options.height}
                      onChange={(e) => setOptions((o) => ({ ...o, height: e.target.value }))}
                      placeholder="400px"
                      className="mt-2"
                    />
                  </div>
                )}
              </>
            )}

            {/* Show Link (for badges) */}
            {options.type === 'badge' && (
              <div>
                <label className="text-sm font-medium">Options</label>
                <div className="mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.showLink}
                      onChange={(e) => setOptions((o) => ({ ...o, showLink: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Link to verification page</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview and Code */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => copyToClipboard()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'preview' && (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-muted/30 p-8">
              {options.type === 'badge' && (
                <VerificationBadge
                  status={status}
                  tokenId={tokenId}
                  size={options.size}
                  variant={options.variant}
                  showLink={options.showLink}
                />
              )}
              {options.type === 'player' && (
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Player embed preview</p>
                  <p className="mt-2 text-sm">
                    {options.width} x {options.height}
                  </p>
                </div>
              )}
              {options.type === 'certificate' && (
                <div className="text-center text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Certificate embed preview</p>
                  <p className="mt-2 text-sm">Token #{tokenId}</p>
                </div>
              )}
              {options.type === 'qrcode' && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-white p-4">
                    <QrCode className="h-24 w-24 text-gray-800" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    QR code links to verification page
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {baseUrl}/verify/{tokenId}
                  </p>
                </div>
              )}
              {options.type === 'jsonld' && (
                <div className="w-full text-left">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    JSON-LD Structured Data Preview
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
                    <code>{jsonLdData}</code>
                  </pre>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Add this to your page's &lt;head&gt; to enable rich search results
                  </p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'code' && (
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                <code>{embedCode}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alternative HTML Snippet */}
      {options.type === 'badge' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Simple HTML (No JavaScript)</CardTitle>
              <Button
                onClick={() => copyToClipboard(htmlSnippet)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
              <code>{htmlSnippet}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* SVG Badge URL */}
      {options.type === 'badge' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Direct Badge URL (SVG)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${baseUrl}/api/badge/${tokenId}.svg?variant=${options.variant}&size=${options.size}&theme=${options.theme}`}
                className="font-mono text-xs"
              />
              <Button
                onClick={() => copyToClipboard(
                  `${baseUrl}/api/badge/${tokenId}.svg?variant=${options.variant}&size=${options.size}&theme=${options.theme}`
                )}
                variant="outline"
                size="sm"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Use this URL directly in any context that supports images (emails, social media, etc.)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
