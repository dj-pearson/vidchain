// VidChain Real-Time Verification API v2
// Comprehensive verification endpoint for enterprise integrations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.9.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// API Response types
interface VerificationResult {
  verified: boolean;
  authenticityScore: number;
  verdict: 'authentic' | 'suspicious' | 'synthetic' | 'manipulated' | 'unknown';
  confidence: number;

  // Verification details
  verification: {
    id: string;
    status: string;
    sha256Hash: string;
    ipfsCid?: string;
    verificationDate: string;
    mediaType: 'video' | 'photo';
  } | null;

  // Blockchain record
  blockchain: {
    network: string;
    contractAddress: string;
    tokenId?: string;
    transactionHash?: string;
    blockNumber?: number;
    mintedAt?: string;
    owner?: string;
  } | null;

  // C2PA manifest
  c2pa: {
    hasManifest: boolean;
    status: string;
    signatureValid: boolean;
    claimGenerator?: string;
    assertions?: string[];
  } | null;

  // AI detection results
  aiDetection: {
    analyzed: boolean;
    authenticityScore: number;
    aiGeneratedProbability: number;
    deepfakeProbability: number;
    verdict: string;
    providersConsulted: number;
  } | null;

  // Similar content
  duplicates: Array<{
    verificationId: string;
    similarity: number;
    verificationDate: string;
    title?: string;
  }>;

  // Provenance chain
  provenance: Array<{
    action: string;
    timestamp: string;
    actor: string;
    transactionHash?: string;
  }>;

  // Warnings and notes
  warnings: string[];
  notes: string[];

  // Embed options
  embed: {
    badgeUrl: string;
    certificateUrl: string;
    qrCodeUrl: string;
    jsonLdUrl: string;
  };

  // Processing metadata
  processingTimeMs: number;
  apiVersion: string;
}

// VidChainNFT ABI
const VIDCHAIN_NFT_ABI = [
  'function verify(uint256 _tokenId) external view returns (bytes32 sha256Hash, bytes32 ipfsCidHash, uint64 timestamp, address owner, bool exists)',
  'function verifyByHash(bytes32 _sha256Hash) external view returns (uint256 tokenId, uint64 timestamp, address owner, bool exists)',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Authenticate via API key or bearer token
    const apiKey = req.headers.get('x-api-key');
    const authHeader = req.headers.get('Authorization');

    if (apiKey) {
      // Validate API key
      const { data: keyData, error: keyError } = await supabaseClient
        .from('api_keys')
        .select('*')
        .eq('key', apiKey)
        .eq('is_active', true)
        .single();

      if (keyError || !keyData) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update usage
      await supabaseClient
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyData.id);
    }

    const url = new URL(req.url);
    const baseUrl = Deno.env.get('VIDCHAIN_BASE_URL') || 'https://vidchain.io';

    // ==========================================
    // VERIFY MEDIA
    // ==========================================
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        query,           // Token ID, transaction hash, SHA-256 hash, or verification ID
        url: mediaUrl,   // Optional: URL to fetch and verify
        checkC2pa = true,
        checkAI = true,
        checkDuplicates = true,
        includeProvenance = true,
      } = body;

      if (!query && !mediaUrl) {
        return new Response(
          JSON.stringify({ error: 'query or url is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const warnings: string[] = [];
      const notes: string[] = [];

      // Determine query type
      const isTokenId = query && /^\d+$/.test(query);
      const isTransactionHash = query && /^0x[a-fA-F0-9]{64}$/.test(query);
      const isSha256Hash = query && /^[a-fA-F0-9]{64}$/.test(query);
      const isUuid = query && /^[a-fA-F0-9-]{36}$/.test(query);

      // Try to find verification in database
      let verification = null;
      let mediaType: 'video' | 'photo' = 'video';

      if (isUuid) {
        // Try video verification first
        const { data: videoVer } = await supabaseClient
          .from('verifications')
          .select('*, video:videos(*), user:users(display_name)')
          .eq('id', query)
          .single();

        if (videoVer) {
          verification = videoVer;
        } else {
          // Try photo verification
          const { data: photoVer } = await supabaseClient
            .from('photo_verifications')
            .select('*, photo:photos(*), user:users(display_name)')
            .eq('id', query)
            .single();

          if (photoVer) {
            verification = photoVer;
            mediaType = 'photo';
          }
        }
      } else if (isTokenId) {
        const { data } = await supabaseClient
          .from('verifications')
          .select('*, video:videos(*), user:users(display_name)')
          .eq('token_id', query)
          .single();
        verification = data;
      } else if (isTransactionHash) {
        const { data } = await supabaseClient
          .from('verifications')
          .select('*, video:videos(*), user:users(display_name)')
          .eq('transaction_hash', query)
          .single();
        verification = data;
      } else if (isSha256Hash) {
        // Try video first
        const { data: videoVer } = await supabaseClient
          .from('verifications')
          .select('*, video:videos(*), user:users(display_name)')
          .eq('sha256_hash', query)
          .single();

        if (videoVer) {
          verification = videoVer;
        } else {
          // Try photo
          const { data: photoVer } = await supabaseClient
            .from('photo_verifications')
            .select('*, photo:photos(*), user:users(display_name)')
            .eq('sha256_hash', query)
            .single();

          if (photoVer) {
            verification = photoVer;
            mediaType = 'photo';
          }
        }
      }

      // Verify on blockchain if we have a token ID
      let blockchainData = null;
      const contractAddress = Deno.env.get('VIDCHAIN_CONTRACT_ADDRESS');
      const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY');

      if ((verification?.token_id || isTokenId) && contractAddress && alchemyApiKey) {
        try {
          const provider = new ethers.JsonRpcProvider(
            `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
          );
          const contract = new ethers.Contract(contractAddress, VIDCHAIN_NFT_ABI, provider);

          const tokenId = verification?.token_id || query;
          const result = await contract.verify(parseInt(tokenId));

          if (result.exists) {
            blockchainData = {
              network: 'Polygon',
              contractAddress,
              tokenId,
              transactionHash: verification?.transaction_hash,
              blockNumber: verification?.block_number,
              mintedAt: new Date(Number(result.timestamp) * 1000).toISOString(),
              owner: result.owner,
              hashOnChain: result.sha256Hash.slice(2),
            };

            // Verify hash matches
            if (verification && blockchainData.hashOnChain !== verification.sha256_hash) {
              warnings.push('SHA-256 hash mismatch between database and blockchain');
            }
          }
        } catch (error) {
          warnings.push(`Blockchain verification failed: ${error.message}`);
        }
      }

      // Get C2PA manifest if requested
      let c2paData = null;
      if (checkC2pa && verification) {
        const mediaId = verification.video?.id || verification.photo?.id;
        if (mediaId) {
          const { data: manifest } = await supabaseClient
            .from('c2pa_manifests')
            .select('*')
            .eq('media_id', mediaId)
            .single();

          if (manifest) {
            c2paData = {
              hasManifest: true,
              status: manifest.status,
              signatureValid: manifest.signature_valid,
              claimGenerator: manifest.claim_generator,
              assertions: manifest.vidchain_manifest?.assertions?.map(
                (a: { label: string }) => a.label
              ),
            };
          } else {
            c2paData = {
              hasManifest: false,
              status: 'no_manifest',
              signatureValid: false,
            };
          }
        }
      }

      // Get AI detection results if requested
      let aiDetectionData = null;
      if (checkAI && verification) {
        const mediaId = verification.video?.id || verification.photo?.id;
        if (mediaId) {
          const { data: consensus } = await supabaseClient
            .from('ai_detection_consensus')
            .select('*')
            .eq('media_id', mediaId)
            .single();

          if (consensus) {
            aiDetectionData = {
              analyzed: true,
              authenticityScore: consensus.overall_authenticity_score,
              aiGeneratedProbability: consensus.ai_generated_probability,
              deepfakeProbability: consensus.deepfake_probability,
              verdict: consensus.verdict,
              providersConsulted: consensus.providers_analyzed,
            };

            if (consensus.verdict !== 'authentic' && consensus.verdict !== 'likely_authentic') {
              warnings.push(`AI detection indicates content may be ${consensus.verdict}`);
            }
          } else {
            aiDetectionData = {
              analyzed: false,
              authenticityScore: 50,
              aiGeneratedProbability: 0.5,
              deepfakeProbability: 0.5,
              verdict: 'not_analyzed',
              providersConsulted: 0,
            };
            notes.push('AI detection has not been run on this content');
          }
        }
      }

      // Check for duplicates if requested
      let duplicates: VerificationResult['duplicates'] = [];
      if (checkDuplicates && verification) {
        const { data: hashIndex } = await supabaseClient
          .from(mediaType === 'photo' ? 'photo_perceptual_hashes' : 'perceptual_hash_index')
          .select('*')
          .eq(mediaType === 'photo' ? 'photo_id' : 'video_id',
              verification.video?.id || verification.photo?.id)
          .single();

        if (hashIndex?.phash || hashIndex?.phash_video) {
          const phash = hashIndex.phash || hashIndex.phash_video;
          const { data: similar } = await supabaseClient.rpc(
            mediaType === 'photo' ? 'find_similar_photos' : 'find_similar_videos',
            { target_phash: phash, max_distance: 10, limit_count: 5 }
          );

          if (similar && similar.length > 0) {
            duplicates = similar
              .filter((s: { verification_id: string }) => s.verification_id !== verification.id)
              .map((s: { verification_id: string; similarity: number }) => ({
                verificationId: s.verification_id,
                similarity: s.similarity,
                verificationDate: '', // Would need to join
              }));

            if (duplicates.length > 0) {
              warnings.push(`Found ${duplicates.length} potentially similar content`);
            }
          }
        }
      }

      // Get provenance if requested
      let provenance: VerificationResult['provenance'] = [];
      if (includeProvenance && verification && mediaType === 'video') {
        const { data: provenanceRecords } = await supabaseClient
          .from('provenance_records')
          .select('*')
          .eq('verification_id', verification.id)
          .order('created_at', { ascending: true });

        if (provenanceRecords) {
          provenance = provenanceRecords.map((p) => ({
            action: p.action,
            timestamp: p.created_at,
            actor: p.actor_name || p.actor_address || 'System',
            transactionHash: p.transaction_hash,
          }));
        }
      }

      // Calculate overall authenticity score
      let authenticityScore = 50;
      let verdict: VerificationResult['verdict'] = 'unknown';
      let confidence = 0;

      if (verification) {
        // Start with base score
        authenticityScore = 70;
        confidence = 50;

        // Blockchain verification boosts score
        if (blockchainData) {
          authenticityScore += 15;
          confidence += 20;
          if (!warnings.some((w) => w.includes('mismatch'))) {
            authenticityScore += 5;
          }
        }

        // C2PA manifest boosts score
        if (c2paData?.hasManifest && c2paData?.signatureValid) {
          authenticityScore += 5;
          confidence += 10;
        }

        // AI detection can lower score
        if (aiDetectionData?.analyzed) {
          const aiScore = aiDetectionData.authenticityScore;
          authenticityScore = (authenticityScore * 0.6) + (aiScore * 0.4);
          confidence += 15;
        }

        // Duplicates can lower score
        if (duplicates.length > 0) {
          authenticityScore -= 10;
        }

        // Clamp score
        authenticityScore = Math.max(0, Math.min(100, authenticityScore));
        confidence = Math.max(0, Math.min(100, confidence));

        // Determine verdict
        if (authenticityScore >= 80) {
          verdict = 'authentic';
        } else if (authenticityScore >= 60) {
          verdict = 'suspicious';
        } else if (aiDetectionData?.verdict === 'synthetic' || aiDetectionData?.verdict === 'deepfake') {
          verdict = aiDetectionData.verdict === 'deepfake' ? 'manipulated' : 'synthetic';
        } else if (authenticityScore >= 40) {
          verdict = 'suspicious';
        } else {
          verdict = 'synthetic';
        }
      } else {
        notes.push('No verification record found for this query');
      }

      // Build result
      const result: VerificationResult = {
        verified: !!verification && authenticityScore >= 60,
        authenticityScore: Math.round(authenticityScore),
        verdict,
        confidence: Math.round(confidence),

        verification: verification ? {
          id: verification.id,
          status: verification.status,
          sha256Hash: verification.sha256_hash,
          ipfsCid: verification.ipfs_cid,
          verificationDate: verification.blockchain_timestamp || verification.created_at,
          mediaType,
        } : null,

        blockchain: blockchainData ? {
          network: blockchainData.network,
          contractAddress: blockchainData.contractAddress,
          tokenId: blockchainData.tokenId,
          transactionHash: blockchainData.transactionHash,
          blockNumber: blockchainData.blockNumber,
          mintedAt: blockchainData.mintedAt,
          owner: blockchainData.owner,
        } : null,

        c2pa: c2paData,
        aiDetection: aiDetectionData,
        duplicates,
        provenance,
        warnings,
        notes,

        embed: verification ? {
          badgeUrl: `${baseUrl}/api/badge/${verification.id}.svg`,
          certificateUrl: `${baseUrl}/certificate/${verification.id}`,
          qrCodeUrl: `${baseUrl}/api/badge/${verification.id}/qr`,
          jsonLdUrl: `${baseUrl}/api/badge/${verification.id}.json`,
        } : {
          badgeUrl: '',
          certificateUrl: '',
          qrCodeUrl: '',
          jsonLdUrl: '',
        },

        processingTimeMs: Date.now() - startTime,
        apiVersion: '2.0.0',
      };

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Processing-Time-Ms': String(result.processingTimeMs),
          },
        }
      );
    }

    // ==========================================
    // GET VERIFICATION STATUS (Simple endpoint)
    // ==========================================
    if (req.method === 'GET') {
      const query = url.searchParams.get('query') || url.searchParams.get('hash') || url.searchParams.get('tokenId');

      if (!query) {
        return new Response(
          JSON.stringify({ error: 'query parameter required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Quick lookup
      const isSha256Hash = /^[a-fA-F0-9]{64}$/.test(query);
      const isTokenId = /^\d+$/.test(query);

      let verified = false;
      let verificationId = null;

      if (isSha256Hash) {
        const { data } = await supabaseClient
          .from('verifications')
          .select('id, status')
          .eq('sha256_hash', query)
          .single();

        verified = data?.status === 'completed';
        verificationId = data?.id;
      } else if (isTokenId) {
        const { data } = await supabaseClient
          .from('verifications')
          .select('id, status')
          .eq('token_id', query)
          .single();

        verified = data?.status === 'completed';
        verificationId = data?.id;
      }

      return new Response(
        JSON.stringify({
          verified,
          verificationId,
          detailsUrl: verificationId ? `${baseUrl}/verify/${verificationId}` : null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verification API error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        processingTimeMs: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
