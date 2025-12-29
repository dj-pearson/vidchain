// VidChain Verification Badge Edge Function
// Generates embeddable verification badges in SVG, HTML, and JSON-LD formats

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

type BadgeStyle = 'minimal' | 'standard' | 'detailed' | 'compact' | 'full';
type VerificationStatus = 'verified' | 'unverified' | 'pending' | 'expired';

interface BadgeConfig {
  style: BadgeStyle;
  showTokenId: boolean;
  showVerificationDate: boolean;
  showBlockchainInfo: boolean;
  showQrCode: boolean;
  primaryColor: string;
  secondaryColor: string;
  customLogoUrl?: string;
}

interface VerificationData {
  status: VerificationStatus;
  tokenId?: string;
  verificationDate: string;
  blockchainNetwork: string;
  transactionHash?: string;
  ipfsCid?: string;
  title?: string;
  creatorName?: string;
}

// Generate SVG badge
function generateSVGBadge(data: VerificationData, config: BadgeConfig): string {
  const colors = {
    verified: config.primaryColor || '#22c55e',
    unverified: '#ef4444',
    pending: '#f59e0b',
    expired: '#6b7280',
  };

  const bgColor = colors[data.status];
  const textColor = '#ffffff';

  if (config.style === 'minimal') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="24" viewBox="0 0 120 24">
  <rect width="120" height="24" rx="4" fill="${bgColor}"/>
  <text x="60" y="16" text-anchor="middle" fill="${textColor}" font-family="system-ui, sans-serif" font-size="11" font-weight="500">
    ${data.status === 'verified' ? '✓ Verified' : data.status.charAt(0).toUpperCase() + data.status.slice(1)}
  </text>
</svg>`;
  }

  if (config.style === 'compact') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="32" viewBox="0 0 140 32">
  <rect width="140" height="32" rx="6" fill="${bgColor}"/>
  <circle cx="16" cy="16" r="8" fill="${textColor}" fill-opacity="0.2"/>
  <path d="M12 16l3 3 6-6" stroke="${textColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="75" y="20" text-anchor="middle" fill="${textColor}" font-family="system-ui, sans-serif" font-size="12" font-weight="600">
    VidChain ${data.status === 'verified' ? 'Verified' : data.status}
  </text>
</svg>`;
  }

  if (config.style === 'standard') {
    const width = 200;
    const height = 48;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor};stop-opacity:0.85" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="8" fill="url(#bg-gradient)"/>

  <!-- Shield icon -->
  <g transform="translate(12, 8)">
    <path d="M16 2L4 7v6c0 5.55 3.84 10.74 12 12 8.16-1.26 12-6.45 12-12V7L16 2z"
          fill="${textColor}" fill-opacity="0.2"/>
    <path d="M14 16l-4-4 1.41-1.41L14 13.17l6.59-6.59L22 8l-8 8z"
          fill="${textColor}"/>
  </g>

  <!-- Text -->
  <text x="52" y="22" fill="${textColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="700">
    VidChain
  </text>
  <text x="52" y="38" fill="${textColor}" fill-opacity="0.9" font-family="system-ui, sans-serif" font-size="11">
    ${data.status === 'verified' ? '✓ Verified Content' : data.status.charAt(0).toUpperCase() + data.status.slice(1)}
  </text>

  ${config.showTokenId && data.tokenId ? `
  <text x="${width - 12}" y="30" text-anchor="end" fill="${textColor}" fill-opacity="0.7" font-family="monospace" font-size="9">
    #${data.tokenId}
  </text>` : ''}
</svg>`;
  }

  if (config.style === 'detailed' || config.style === 'full') {
    const width = 280;
    const height = config.style === 'full' ? 120 : 80;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor};stop-opacity:0.9" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.2"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" rx="10" fill="url(#bg-gradient)" filter="url(#shadow)"/>

  <!-- Header -->
  <rect x="12" y="12" width="48" height="48" rx="8" fill="${textColor}" fill-opacity="0.15"/>
  <g transform="translate(20, 20)">
    <path d="M16 2L4 7v6c0 5.55 3.84 10.74 12 12 8.16-1.26 12-6.45 12-12V7L16 2z"
          fill="${textColor}" fill-opacity="0.3"/>
    <path d="M14 19l-5-5 1.41-1.41L14 16.17l7.59-7.59L23 10l-9 9z"
          fill="${textColor}" stroke="${textColor}" stroke-width="1"/>
  </g>

  <!-- Title and status -->
  <text x="72" y="30" fill="${textColor}" font-family="system-ui, sans-serif" font-size="16" font-weight="700">
    VidChain Verified
  </text>
  <text x="72" y="48" fill="${textColor}" fill-opacity="0.85" font-family="system-ui, sans-serif" font-size="11">
    Authenticity confirmed on blockchain
  </text>

  ${config.showTokenId && data.tokenId ? `
  <text x="${width - 16}" y="28" text-anchor="end" fill="${textColor}" fill-opacity="0.7" font-family="monospace" font-size="10">
    Token #${data.tokenId}
  </text>` : ''}

  ${config.showVerificationDate ? `
  <text x="${width - 16}" y="44" text-anchor="end" fill="${textColor}" fill-opacity="0.6" font-family="system-ui, sans-serif" font-size="9">
    ${new Date(data.verificationDate).toLocaleDateString()}
  </text>` : ''}

  ${config.style === 'full' && config.showBlockchainInfo ? `
  <!-- Blockchain info -->
  <line x1="12" y1="68" x2="${width - 12}" y2="68" stroke="${textColor}" stroke-opacity="0.2" stroke-width="1"/>
  <text x="16" y="86" fill="${textColor}" fill-opacity="0.7" font-family="system-ui, sans-serif" font-size="9">
    Network: ${data.blockchainNetwork}
  </text>
  ${data.transactionHash ? `
  <text x="16" y="102" fill="${textColor}" fill-opacity="0.6" font-family="monospace" font-size="8">
    TX: ${data.transactionHash.slice(0, 10)}...${data.transactionHash.slice(-8)}
  </text>` : ''}
  ${data.ipfsCid ? `
  <text x="${width - 16}" y="86" text-anchor="end" fill="${textColor}" fill-opacity="0.6" font-family="monospace" font-size="8">
    IPFS: ${data.ipfsCid.slice(0, 12)}...
  </text>` : ''}` : ''}
</svg>`;
  }

  // Default to standard
  return generateSVGBadge(data, { ...config, style: 'standard' });
}

// Generate HTML embed code
function generateHTMLEmbed(verificationId: string, config: BadgeConfig): string {
  const baseUrl = Deno.env.get('VIDCHAIN_BASE_URL') || 'https://vidchain.io';

  return `<!-- VidChain Verification Badge -->
<div class="vidchain-badge" data-verification-id="${verificationId}" data-style="${config.style}">
  <a href="${baseUrl}/verify/${verificationId}" target="_blank" rel="noopener noreferrer">
    <img src="${baseUrl}/api/badge/${verificationId}.svg?style=${config.style}"
         alt="VidChain Verified"
         style="height: auto; max-width: 100%;" />
  </a>
</div>
<script async src="${baseUrl}/badge.js"></script>`;
}

// Generate JSON-LD structured data
function generateJSONLD(data: VerificationData, verificationId: string): string {
  const baseUrl = Deno.env.get('VIDCHAIN_BASE_URL') || 'https://vidchain.io';

  return JSON.stringify({
    '@context': [
      'https://schema.org',
      {
        'vidchain': 'https://vidchain.io/schema/',
      },
    ],
    '@type': 'VideoObject',
    'name': data.title || 'Verified Media',
    'vidchain:verification': {
      '@type': 'vidchain:VerificationRecord',
      'verificationStatus': data.status,
      'verificationDate': data.verificationDate,
      'tokenId': data.tokenId,
      'blockchainNetwork': data.blockchainNetwork,
      'transactionHash': data.transactionHash,
      'ipfsCid': data.ipfsCid,
      'verifyUrl': `${baseUrl}/verify/${verificationId}`,
      'certificateUrl': `${baseUrl}/certificate/${verificationId}`,
    },
    'creator': data.creatorName ? {
      '@type': 'Person',
      'name': data.creatorName,
    } : undefined,
  }, null, 2);
}

// Generate QR code as SVG
function generateQRCode(url: string, size: number = 100): string {
  // Simple QR code placeholder - in production, use a proper QR library
  // This creates a visual placeholder that links to the verification
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#ffffff"/>
    <rect x="5" y="5" width="25" height="25" fill="#000000"/>
    <rect x="70" y="5" width="25" height="25" fill="#000000"/>
    <rect x="5" y="70" width="25" height="25" fill="#000000"/>
    <rect x="10" y="10" width="15" height="15" fill="#ffffff"/>
    <rect x="75" y="10" width="15" height="15" fill="#ffffff"/>
    <rect x="10" y="75" width="15" height="15" fill="#ffffff"/>
    <rect x="13" y="13" width="9" height="9" fill="#000000"/>
    <rect x="78" y="13" width="9" height="9" fill="#000000"/>
    <rect x="13" y="78" width="9" height="9" fill="#000000"/>
    <text x="50" y="55" text-anchor="middle" font-size="6" fill="#000000">SCAN TO</text>
    <text x="50" y="63" text-anchor="middle" font-size="6" fill="#000000">VERIFY</text>
  </svg>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const verificationId = pathParts[pathParts.length - 1]?.replace(/\.(svg|png|html|json)$/, '');
    const format = pathParts[pathParts.length - 1]?.match(/\.(svg|png|html|json)$/)?.[1] || 'svg';

    if (!verificationId) {
      return new Response(
        JSON.stringify({ error: 'Verification ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get verification data
    const { data: verification, error: verificationError } = await supabaseClient
      .from('verifications')
      .select(`
        *,
        video:videos(title),
        user:users(display_name)
      `)
      .eq('id', verificationId)
      .single();

    // Also check photo verifications
    let photoVerification = null;
    if (!verification) {
      const { data } = await supabaseClient
        .from('photo_verifications')
        .select(`
          *,
          photo:photos(title),
          user:users(display_name)
        `)
        .eq('id', verificationId)
        .single();
      photoVerification = data;
    }

    const data = verification || photoVerification;

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get badge config
    const { data: badgeConfig } = await supabaseClient
      .from('verification_badges')
      .select('*')
      .or(`verification_id.eq.${verificationId},photo_verification_id.eq.${verificationId}`)
      .single();

    const config: BadgeConfig = {
      style: (url.searchParams.get('style') as BadgeStyle) || badgeConfig?.style || 'standard',
      showTokenId: badgeConfig?.show_token_id ?? true,
      showVerificationDate: badgeConfig?.show_verification_date ?? true,
      showBlockchainInfo: badgeConfig?.show_blockchain_info ?? false,
      showQrCode: badgeConfig?.show_qr_code ?? true,
      primaryColor: url.searchParams.get('color') || badgeConfig?.primary_color || '#22c55e',
      secondaryColor: badgeConfig?.secondary_color || '#000000',
      customLogoUrl: badgeConfig?.custom_logo_url,
    };

    const verificationData: VerificationData = {
      status: data.status === 'completed' ? 'verified' : data.status as VerificationStatus,
      tokenId: data.token_id,
      verificationDate: data.blockchain_timestamp || data.created_at,
      blockchainNetwork: 'Polygon',
      transactionHash: data.transaction_hash,
      ipfsCid: data.ipfs_cid,
      title: data.video?.title || data.photo?.title,
      creatorName: data.user?.display_name,
    };

    // Track embed
    const referer = req.headers.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        await supabaseClient.from('badge_embeds').insert({
          badge_id: badgeConfig?.id,
          embed_url: referer,
          embed_domain: refererUrl.hostname,
          embed_type: format,
          referrer: referer,
        });

        // Update view count
        if (badgeConfig?.id) {
          await supabaseClient.rpc('increment_badge_views', { badge_id: badgeConfig.id });
        }
      } catch {
        // Ignore tracking errors
      }
    }

    // Generate response based on format
    if (format === 'svg') {
      const svg = generateSVGBadge(verificationData, config);
      return new Response(svg, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/svg+xml',
        },
      });
    }

    if (format === 'html') {
      const html = generateHTMLEmbed(verificationId, config);
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
      });
    }

    if (format === 'json') {
      const jsonLd = generateJSONLD(verificationData, verificationId);
      return new Response(jsonLd, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/ld+json',
        },
      });
    }

    // Default: return all formats
    return new Response(
      JSON.stringify({
        verification: verificationData,
        config,
        embed: {
          svg: `${url.origin}/badge/${verificationId}.svg`,
          html: generateHTMLEmbed(verificationId, config),
          jsonLd: JSON.parse(generateJSONLD(verificationData, verificationId)),
          qr: `${url.origin}/badge/${verificationId}/qr`,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Badge generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
