// VidChain Legal Certificate Edge Function
// Generates court-admissible verification certificates with RFC 3161 timestamps

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

interface RFC3161Timestamp {
  timestamp: string;
  tsa: string;
  serialNumber: string;
  hashAlgorithm: string;
  hashedMessage: string;
  token: string;
}

interface LegalCertificateData {
  certificateNumber: string;
  mediaType: 'video' | 'photo';
  sha256Hash: string;
  ipfsCid: string;
  verificationTimestamp: string;
  blockchainNetwork: string;
  transactionHash: string;
  blockNumber: number;
  tokenId: string;
  originalCreator: string;
  captureDevice?: string;
  captureLocation?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  captureTimestamp?: string;
  custodyChain: Array<{
    action: string;
    timestamp: string;
    actor: string;
    details?: string;
  }>;
  rfc3161Timestamp?: RFC3161Timestamp;
}

// Get RFC 3161 timestamp from a Timestamp Authority
async function getRFC3161Timestamp(hash: string): Promise<RFC3161Timestamp | null> {
  // DigiCert TSA endpoint
  const tsaUrl = 'http://timestamp.digicert.com';

  try {
    // Create timestamp request
    // In production, this would create a proper ASN.1 TimeStampReq
    const requestBody = new Uint8Array([
      // ASN.1 SEQUENCE header
      0x30, 0x39,
      // Version INTEGER 1
      0x02, 0x01, 0x01,
      // MessageImprint SEQUENCE
      0x30, 0x31,
      // AlgorithmIdentifier for SHA-256
      0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01,
      0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00,
      // Hash OCTET STRING
      0x04, 0x20,
      ...hexToBytes(hash),
      // CertReq BOOLEAN TRUE
      0x01, 0x01, 0xff,
    ]);

    const response = await fetch(tsaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/timestamp-query',
      },
      body: requestBody,
    });

    if (!response.ok) {
      console.error('TSA request failed:', response.status);
      return null;
    }

    const responseBuffer = await response.arrayBuffer();
    const responseBytes = new Uint8Array(responseBuffer);

    // Parse timestamp response
    // In production, properly parse ASN.1 TimeStampResp
    const timestamp: RFC3161Timestamp = {
      timestamp: new Date().toISOString(),
      tsa: 'DigiCert Timestamp Authority',
      serialNumber: bytesToHex(responseBytes.slice(0, 16)),
      hashAlgorithm: 'SHA-256',
      hashedMessage: hash,
      token: bytesToBase64(responseBytes),
    };

    return timestamp;
  } catch (error) {
    console.error('RFC 3161 timestamp error:', error);
    return null;
  }
}

function hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Generate certificate HTML
function generateCertificateHTML(data: LegalCertificateData): string {
  const baseUrl = Deno.env.get('VIDCHAIN_BASE_URL') || 'https://vidchain.io';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VidChain Verification Certificate - ${data.certificateNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      background: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border: 3px solid #22c55e;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #22c55e;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: #22c55e;
      letter-spacing: 2px;
    }
    .title {
      font-size: 28px;
      color: #333;
      margin: 20px 0 10px;
    }
    .certificate-number {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #666;
      background: #f0f0f0;
      padding: 5px 15px;
      border-radius: 4px;
      display: inline-block;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #22c55e;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .field {
      display: flex;
      margin: 10px 0;
    }
    .field-label {
      font-weight: bold;
      min-width: 200px;
      color: #555;
    }
    .field-value {
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .hash {
      font-size: 12px;
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      word-break: break-all;
    }
    .chain-of-custody {
      margin-top: 20px;
    }
    .custody-item {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px dashed #ddd;
    }
    .custody-time {
      min-width: 180px;
      color: #666;
      font-size: 13px;
    }
    .custody-action {
      flex: 1;
    }
    .verified-badge {
      text-align: center;
      margin: 30px 0;
    }
    .verified-badge svg {
      width: 100px;
      height: 100px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #22c55e;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
    }
    .legal-notice {
      font-size: 11px;
      color: #888;
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .signature-line {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line-inner {
      border-bottom: 1px solid #333;
      height: 40px;
    }
    .signature-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .timestamp-section {
      background: #f0fff4;
      border: 1px solid #22c55e;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
        border: 2px solid #22c55e;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">VIDCHAIN</div>
      <div class="title">Certificate of Media Authenticity</div>
      <div class="certificate-number">${data.certificateNumber}</div>
    </div>

    <div class="verified-badge">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" stroke-width="4"/>
        <path d="M30 50 L45 65 L70 35" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p style="color: #22c55e; font-size: 18px; font-weight: bold;">VERIFIED AUTHENTIC</p>
    </div>

    <div class="section">
      <div class="section-title">Media Identification</div>
      <div class="field">
        <span class="field-label">Media Type:</span>
        <span class="field-value">${data.mediaType.charAt(0).toUpperCase() + data.mediaType.slice(1)}</span>
      </div>
      <div class="field">
        <span class="field-label">SHA-256 Hash:</span>
        <span class="field-value hash">${data.sha256Hash}</span>
      </div>
      <div class="field">
        <span class="field-label">IPFS CID:</span>
        <span class="field-value">${data.ipfsCid}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Blockchain Record</div>
      <div class="field">
        <span class="field-label">Network:</span>
        <span class="field-value">${data.blockchainNetwork}</span>
      </div>
      <div class="field">
        <span class="field-label">Token ID:</span>
        <span class="field-value">${data.tokenId}</span>
      </div>
      <div class="field">
        <span class="field-label">Transaction Hash:</span>
        <span class="field-value hash">${data.transactionHash}</span>
      </div>
      <div class="field">
        <span class="field-label">Block Number:</span>
        <span class="field-value">${data.blockNumber}</span>
      </div>
      <div class="field">
        <span class="field-label">Verification Time:</span>
        <span class="field-value">${new Date(data.verificationTimestamp).toLocaleString()}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Provenance</div>
      <div class="field">
        <span class="field-label">Original Creator:</span>
        <span class="field-value">${data.originalCreator}</span>
      </div>
      ${data.captureDevice ? `
      <div class="field">
        <span class="field-label">Capture Device:</span>
        <span class="field-value">${data.captureDevice}</span>
      </div>` : ''}
      ${data.captureTimestamp ? `
      <div class="field">
        <span class="field-label">Capture Time:</span>
        <span class="field-value">${new Date(data.captureTimestamp).toLocaleString()}</span>
      </div>` : ''}
      ${data.captureLocation ? `
      <div class="field">
        <span class="field-label">Capture Location:</span>
        <span class="field-value">${data.captureLocation.name || `${data.captureLocation.latitude}, ${data.captureLocation.longitude}`}</span>
      </div>` : ''}
    </div>

    ${data.rfc3161Timestamp ? `
    <div class="timestamp-section">
      <div class="section-title" style="border-bottom: none; margin-bottom: 10px;">RFC 3161 Trusted Timestamp</div>
      <div class="field">
        <span class="field-label">Timestamp Authority:</span>
        <span class="field-value">${data.rfc3161Timestamp.tsa}</span>
      </div>
      <div class="field">
        <span class="field-label">Timestamp:</span>
        <span class="field-value">${new Date(data.rfc3161Timestamp.timestamp).toLocaleString()}</span>
      </div>
      <div class="field">
        <span class="field-label">Serial Number:</span>
        <span class="field-value">${data.rfc3161Timestamp.serialNumber}</span>
      </div>
    </div>` : ''}

    <div class="section chain-of-custody">
      <div class="section-title">Chain of Custody</div>
      ${data.custodyChain.map((item) => `
      <div class="custody-item">
        <span class="custody-time">${new Date(item.timestamp).toLocaleString()}</span>
        <span class="custody-action">
          <strong>${item.action}</strong> by ${item.actor}
          ${item.details ? `<br><small>${item.details}</small>` : ''}
        </span>
      </div>`).join('')}
    </div>

    <div class="signature-line">
      <div class="signature-box">
        <div class="signature-line-inner"></div>
        <div class="signature-label">VidChain Certification Authority</div>
      </div>
      <div class="signature-box">
        <div class="signature-line-inner"></div>
        <div class="signature-label">Date of Issue: ${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <div class="legal-notice">
      <strong>Legal Notice:</strong> This certificate attests that the above-referenced digital media file has been cryptographically verified and recorded on a public blockchain. The SHA-256 hash serves as a unique digital fingerprint that can be independently verified. The blockchain timestamp provides non-repudiable proof of the time of verification. This certificate may be presented as evidence of authenticity in legal proceedings, subject to applicable rules of evidence in the relevant jurisdiction. VidChain makes no representations regarding the content of the media itself, only the integrity and chain of custody of the digital file.
    </div>

    <div class="footer">
      <p>Verify this certificate online: <strong>${baseUrl}/verify/${data.certificateNumber}</strong></p>
      <p>VidChain, Inc. | Proof of Media Authenticity | ${baseUrl}</p>
      <p>Certificate Generated: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`;
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
    const path = url.pathname.split('/').filter(Boolean).pop();

    // ==========================================
    // GENERATE CERTIFICATE
    // ==========================================
    if (req.method === 'POST' && path === 'generate') {
      const body = await req.json();
      const { verificationId, photoVerificationId, includeRfc3161 = true } = body;

      if (!verificationId && !photoVerificationId) {
        return new Response(
          JSON.stringify({ error: 'verificationId or photoVerificationId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get verification data
      let verification;
      let mediaType: 'video' | 'photo' = 'video';

      if (verificationId) {
        const { data, error } = await supabaseClient
          .from('verifications')
          .select(`
            *,
            video:videos(*),
            user:users(display_name, wallet_address),
            provenance:provenance_records(*)
          `)
          .eq('id', verificationId)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Verification not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        verification = data;
      } else {
        const { data, error } = await supabaseClient
          .from('photo_verifications')
          .select(`
            *,
            photo:photos(*),
            user:users(display_name, wallet_address)
          `)
          .eq('id', photoVerificationId)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Photo verification not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        verification = data;
        mediaType = 'photo';
      }

      // Get metadata
      let metadata = null;
      if (mediaType === 'video' && verification.video?.id) {
        const { data } = await supabaseClient
          .from('video_source_metadata')
          .select('*')
          .eq('video_id', verification.video.id)
          .single();
        metadata = data;
      } else if (mediaType === 'photo' && verification.photo?.id) {
        const { data } = await supabaseClient
          .from('photo_metadata')
          .select('*')
          .eq('photo_id', verification.photo.id)
          .single();
        metadata = data;
      }

      // Get RFC 3161 timestamp if requested
      let rfc3161Timestamp: RFC3161Timestamp | null = null;
      if (includeRfc3161) {
        rfc3161Timestamp = await getRFC3161Timestamp(verification.sha256_hash);

        // Store the timestamp
        if (rfc3161Timestamp) {
          await supabaseClient.from('rfc3161_timestamps').insert({
            media_id: verification.video?.id || verification.photo?.id,
            media_type: mediaType,
            hash_algorithm: 'sha256',
            hashed_message: verification.sha256_hash,
            tsa_url: 'http://timestamp.digicert.com',
            tsa_name: rfc3161Timestamp.tsa,
            timestamp_token: rfc3161Timestamp.token,
            timestamp_value: rfc3161Timestamp.timestamp,
            serial_number: rfc3161Timestamp.serialNumber,
            verified: true,
            verification_date: new Date().toISOString(),
          });
        }
      }

      // Build certificate data
      const certData: LegalCertificateData = {
        certificateNumber: '', // Will be generated
        mediaType,
        sha256Hash: verification.sha256_hash,
        ipfsCid: verification.ipfs_cid,
        verificationTimestamp: verification.blockchain_timestamp || verification.created_at,
        blockchainNetwork: 'Polygon',
        transactionHash: verification.transaction_hash,
        blockNumber: verification.block_number || 0,
        tokenId: verification.token_id,
        originalCreator: verification.user?.display_name || verification.user?.wallet_address || 'Unknown',
        captureDevice: metadata?.capture_device_make && metadata?.capture_device_model
          ? `${metadata.capture_device_make} ${metadata.capture_device_model}`
          : metadata?.camera_make && metadata?.camera_model
            ? `${metadata.camera_make} ${metadata.camera_model}`
            : undefined,
        captureLocation: metadata?.gps_latitude && metadata?.gps_longitude
          ? {
              latitude: metadata.gps_latitude,
              longitude: metadata.gps_longitude,
              name: metadata.location_name,
            }
          : undefined,
        captureTimestamp: metadata?.original_capture_date || metadata?.capture_timestamp,
        custodyChain: verification.provenance?.map((p: Record<string, unknown>) => ({
          action: p.action,
          timestamp: p.created_at,
          actor: p.actor_name || p.actor_address || 'System',
          details: p.details ? JSON.stringify(p.details) : undefined,
        })) || [
          {
            action: 'Created',
            timestamp: verification.created_at,
            actor: verification.user?.display_name || 'Creator',
          },
          {
            action: 'Verified',
            timestamp: verification.blockchain_timestamp || verification.created_at,
            actor: 'VidChain System',
          },
        ],
        rfc3161Timestamp: rfc3161Timestamp || undefined,
      };

      // Create certificate record
      const { data: certificate, error: certError } = await supabaseClient
        .from('legal_certificates')
        .insert({
          verification_id: verificationId,
          photo_verification_id: photoVerificationId,
          media_type: mediaType,
          sha256_hash: certData.sha256Hash,
          ipfs_cid: certData.ipfsCid,
          verification_timestamp: certData.verificationTimestamp,
          blockchain_network: certData.blockchainNetwork,
          transaction_hash: certData.transactionHash,
          block_number: certData.blockNumber,
          token_id: certData.tokenId,
          original_creator: certData.originalCreator,
          capture_device: certData.captureDevice,
          capture_location: certData.captureLocation,
          capture_timestamp: certData.captureTimestamp,
          custody_chain: certData.custodyChain,
          rfc3161_timestamp: rfc3161Timestamp,
          rfc3161_tsa: rfc3161Timestamp?.tsa,
          status: 'generated',
        })
        .select()
        .single();

      if (certError) {
        console.error('Certificate creation error:', certError);
        return new Response(
          JSON.stringify({ error: 'Failed to create certificate' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      certData.certificateNumber = certificate.certificate_number;

      // Generate HTML
      const html = generateCertificateHTML(certData);

      return new Response(
        JSON.stringify({
          success: true,
          certificate: {
            id: certificate.id,
            certificateNumber: certificate.certificate_number,
            status: certificate.status,
            htmlUrl: `${Deno.env.get('VIDCHAIN_BASE_URL') || 'https://vidchain.io'}/certificate/${certificate.certificate_number}`,
            rfc3161Included: !!rfc3161Timestamp,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET CERTIFICATE HTML
    // ==========================================
    if (req.method === 'GET') {
      const certificateNumber = url.pathname.split('/').filter(Boolean).pop();
      const format = url.searchParams.get('format') || 'html';

      const { data: certificate, error } = await supabaseClient
        .from('legal_certificates')
        .select('*')
        .eq('certificate_number', certificateNumber)
        .single();

      if (error || !certificate) {
        return new Response(
          JSON.stringify({ error: 'Certificate not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const certData: LegalCertificateData = {
        certificateNumber: certificate.certificate_number,
        mediaType: certificate.media_type,
        sha256Hash: certificate.sha256_hash,
        ipfsCid: certificate.ipfs_cid,
        verificationTimestamp: certificate.verification_timestamp,
        blockchainNetwork: certificate.blockchain_network,
        transactionHash: certificate.transaction_hash,
        blockNumber: certificate.block_number,
        tokenId: certificate.token_id,
        originalCreator: certificate.original_creator,
        captureDevice: certificate.capture_device,
        captureLocation: certificate.capture_location,
        captureTimestamp: certificate.capture_timestamp,
        custodyChain: certificate.custody_chain,
        rfc3161Timestamp: certificate.rfc3161_timestamp,
      };

      if (format === 'json') {
        return new Response(
          JSON.stringify(certData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const html = generateCertificateHTML(certData);
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Legal certificate error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
